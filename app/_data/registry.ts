import 'server-only';
import { unixTimeToRippleTime } from 'xrpl';
import { agentRecords } from '../../src/agent/records.ts';
import { DEMO_BUSINESS } from '../../src/config/demo.ts';
import { AGENT_MANDATE_CREDENTIAL_TYPE, checkCredential } from '../../src/domain/credential-check.ts';
import { mandateFingerprint } from '../../src/domain/fingerprint.ts';
import { agentCredentialQuery } from '../../src/ledger/credential.ts';
import { findCredential, getCredentialHistory } from '../../src/ledger/reads.ts';
import { runActivity, type RunActivity } from '../../src/views/activity.ts';
import { withDemo } from './ledger.ts';

export type AgentStatus =
  | { state: 'active' }
  | { state: 'revoked'; at: string | undefined }
  | { state: 'mismatch' }
  | { state: 'not-registered' };

export interface RegistryView {
  business: typeof DEMO_BUSINESS & { ledgerAddress: string };
  agent: {
    address: string;
    status: AgentStatus;
    credentialId: string | undefined;
    credentialHash: string | undefined;
    issuer: string;
  };
  mandate:
    | {
        approvedRecipients: { label: string; address: string }[];
        perPaymentLimit: string;
        dailyLimit: string;
        usedToday: string;
        expiresAt: string;
        fingerprint: string;
      }
    | undefined;
  activity: RunActivity | undefined;
}

/** Everything the agent registry screen shows, read from the ledger and the service stores. */
export async function loadRegistry(): Promise<RegistryView> {
  return withDemo(async (ctx) => {
    const { client, wallets } = ctx;
    const agent = wallets.agent.address;
    const issuer = wallets.issuer.address;
    const query = agentCredentialQuery(agent, issuer);

    const [credential, history, mandate, usedToday] = await Promise.all([
      findCredential(client, query),
      getCredentialHistory(client, query),
      ctx.policy.currentMandate(agent),
      ctx.policy.todaysTotal(agent),
    ]);

    let status: AgentStatus;
    if (credential === undefined) {
      const latest = history[0];
      status = latest?.type === 'CredentialDelete' ? { state: 'revoked', at: latest.closeTimeIso } : { state: 'not-registered' };
    } else {
      const check =
        mandate === undefined
          ? { valid: false }
          : checkCredential(
              credential.entry,
              { issuer, subject: agent, credentialType: AGENT_MANDATE_CREDENTIAL_TYPE, fingerprint: mandateFingerprint(mandate) },
              unixTimeToRippleTime(Date.now()),
            );
      status = check.valid ? { state: 'active' } : { state: 'mismatch' };
    }

    const labels = new Map([
      [wallets.exchange.address, 'Demo Exchange, agent lane'],
      [wallets.contractor.address, 'Contractor account'],
    ]);

    const records = agentRecords(ctx.agentStore);
    const [runs, events] = await Promise.all([records.runs.list(), records.events.readAll()]);
    const latestRun = runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];

    return {
      business: { ...DEMO_BUSINESS, ledgerAddress: wallets.business.address },
      agent: {
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
              approvedRecipients: mandate.approvedRecipients.map((address) => ({
                address,
                label: labels.get(address) ?? 'Approved account',
              })),
              perPaymentLimit: mandate.perPaymentLimit,
              dailyLimit: mandate.dailyLimit,
              usedToday,
              expiresAt: mandate.expiresAt,
              fingerprint: mandateFingerprint(mandate),
            },
      activity: latestRun === undefined ? undefined : runActivity(latestRun, events),
    };
  });
}
