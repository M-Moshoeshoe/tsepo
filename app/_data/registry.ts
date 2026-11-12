import 'server-only';
import { LedgerEntry, unixTimeToRippleTime } from 'xrpl';
import { DEMO_AGENT_NAME, DEMO_BUSINESS } from '../../src/config/demo.ts';
import { AGENT_MANDATE_CREDENTIAL_TYPE, checkCredential } from '../../src/domain/credential-check.ts';
import { mandateFingerprint } from '../../src/domain/fingerprint.ts';
import type { Mandate } from '../../src/domain/mandate.ts';
import { agentCredentialQuery } from '../../src/ledger/credential.ts';
import {
  findCredential,
  getAccountState,
  getCredentialHistory,
  getSignerList,
  type CredentialEvent,
  type FoundCredential,
} from '../../src/ledger/reads.ts';
import type { BusinessPayment, Instruction } from '../../src/views/payments.ts';
import { dailyUsage, totalsClearedToday, type DailyUsage } from '../../src/views/usage.ts';
import { readBusinessRecords } from './business.ts';
import { withDemo } from './ledger.ts';

export type AgentStatus =
  | { state: 'active' }
  | { state: 'revoked'; at: string | undefined }
  | { state: 'mismatch' }
  | { state: 'not-registered' };

export interface RegistryView {
  business: typeof DEMO_BUSINESS & { ledgerAddress: string };
  agent: {
    name: string;
    address: string;
    status: AgentStatus;
    credentialId: string | undefined;
    credentialHash: string | undefined;
    issuer: string;
  };
  mandate:
    | {
        approvedRecipients: { name: string; address: string; destinationTag: number | undefined; paidThrough: string | undefined }[];
        perPaymentLimit: string;
        dailyLimit: string;
        usage: DailyUsage;
        /** When the sample workspace last cleared today's totals, if it did today. */
        totalsClearedAt: string | undefined;
        expiresAt: string;
        fingerprint: string;
      }
    | undefined;
  /** Who can sign for the agent account, read from the ledger. */
  signers: {
    entries: { role: string; address: string; weight: number }[];
    quorum: number;
    masterKeyDisabled: boolean;
  } | undefined;
  /** Every instruction the agent received, newest first. */
  instructions: Instruction[];
  /** Every payment, newest first. */
  payments: BusinessPayment[];
}

/** Whether the agent is active, revoked, mismatched or not registered, from what the ledger and the policy service hold. */
export function agentStatus(input: {
  credential: FoundCredential | undefined;
  history: CredentialEvent[];
  mandate: Mandate | undefined;
  issuer: string;
  agent: string;
}): AgentStatus {
  const { credential, history, mandate, issuer, agent } = input;
  if (credential === undefined) {
    const latest = history[0];
    return latest?.type === 'CredentialDelete' ? { state: 'revoked', at: latest.closeTimeIso } : { state: 'not-registered' };
  }
  const check =
    mandate === undefined
      ? { valid: false }
      : checkCredential(
          credential.entry,
          { issuer, subject: agent, credentialType: AGENT_MANDATE_CREDENTIAL_TYPE, fingerprint: mandateFingerprint(mandate) },
          unixTimeToRippleTime(Date.now()),
        );
  return check.valid ? { state: 'active' } : { state: 'mismatch' };
}

/** Everything the agent screen shows, read from the ledger and the service stores. */
export async function loadRegistry(): Promise<RegistryView> {
  return withDemo(async (ctx) => {
    const { client, wallets } = ctx;
    const agent = wallets.agent.address;
    const issuer = wallets.issuer.address;
    const query = agentCredentialQuery(agent, issuer);

    const [credential, history, mandate, usedToday, signerList, account] = await Promise.all([
      findCredential(client, query),
      getCredentialHistory(client, query),
      ctx.policy.currentMandate(agent),
      ctx.policy.todaysTotal(agent),
      getSignerList(client, agent),
      getAccountState(client, agent),
    ]);
    const signerRoles = new Map([
      [wallets.business.address, 'Business key (recovery)'],
      [wallets.agentSigner.address, 'Agent key'],
      [wallets.policy.address, 'Approval service'],
    ]);

    const status = agentStatus({ credential, history, mandate, issuer, agent });

    const accountNames = new Map([[wallets.exchange.address, 'Sample Exchange']]);

    const { instructions, payments, policyLog } = await readBusinessRecords(ctx);

    return {
      business: { ...DEMO_BUSINESS, ledgerAddress: wallets.business.address },
      agent: {
        name: DEMO_AGENT_NAME,
        address: agent,
        status,
        credentialId: credential?.id,
        credentialHash: credential === undefined ? undefined : history.find((event) => event.type === 'CredentialAccept')?.hash,
        issuer,
      },
      mandate:
        mandate === undefined
          ? undefined
          : {
              approvedRecipients: mandate.approvedRecipients.map((recipient) => ({
                name: recipient.name,
                address: recipient.address,
                destinationTag: recipient.destinationTag,
                paidThrough: accountNames.get(recipient.address),
              })),
              perPaymentLimit: mandate.perPaymentLimit,
              dailyLimit: mandate.dailyLimit,
              usage: dailyUsage(usedToday, mandate.dailyLimit),
              totalsClearedAt: totalsClearedToday(policyLog, new Date()),
              expiresAt: mandate.expiresAt,
              fingerprint: mandateFingerprint(mandate),
            },
      signers:
        signerList === undefined
          ? undefined
          : {
              entries: signerList.SignerEntries.map(({ SignerEntry }) => ({
                role: signerRoles.get(SignerEntry.Account) ?? 'Unknown key',
                address: SignerEntry.Account,
                weight: SignerEntry.SignerWeight,
              })),
              quorum: signerList.SignerQuorum,
              masterKeyDisabled: account !== undefined && (account.flags & LedgerEntry.AccountRootFlags.lsfDisableMaster) !== 0,
            },
      instructions,
      payments,
    };
  });
}
