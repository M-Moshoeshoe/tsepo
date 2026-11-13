import 'server-only';
import { isValidClassicAddress, unixTimeToRippleTime } from 'xrpl';
import { DEMO_AGENT_NAME, DEMO_BUSINESS } from '../../src/config/demo.ts';
import { agentCredentialQuery } from '../../src/ledger/credential.ts';
import { findCredential, getCredentialHistory, type CredentialEvent, type FoundCredential } from '../../src/ledger/reads.ts';
import { verifyStatus, type VerifyStatus } from '../../src/views/verify.ts';
import { withDemo } from './ledger.ts';

export interface VerifyView {
  /** The addresses the example chips fill in. */
  examples: { label: string; address: string }[];
  issuer: string;
  result:
    | { kind: 'none' }
    | { kind: 'invalid' }
    | {
        kind: 'checked';
        address: string;
        status: VerifyStatus;
        business: { name: string; registration: string; agentName: string } | undefined;
        credential: FoundCredential | undefined;
        history: CredentialEvent[];
      };
}

/** An account that does not exist yet has no objects or history: the ledger answers actNotFound. */
function isMissingAccount(error: unknown): boolean {
  return error instanceof Error && /actNotFound|Account not found/i.test(error.message);
}

/** Checks an address against the ledger: its Tšepo credential and the credential's history. Read-only. */
export async function loadVerify(rawAddress: string | undefined): Promise<VerifyView> {
  return withDemo(async (ctx) => {
    const issuer = ctx.wallets.issuer.address;
    const examples = [
      { label: 'Lesedi payout agent', address: ctx.wallets.agent.address },
      { label: 'An unregistered agent', address: ctx.wallets.unknownAgent.address },
    ];
    const address = rawAddress?.trim();
    if (address === undefined || address === '') return { examples, issuer, result: { kind: 'none' } };
    if (!isValidClassicAddress(address)) return { examples, issuer, result: { kind: 'invalid' } };

    const query = agentCredentialQuery(address, issuer);
    let credential: FoundCredential | undefined;
    let history: CredentialEvent[] = [];
    let accountExists = true;
    try {
      [credential, history] = await Promise.all([findCredential(ctx.client, query), getCredentialHistory(ctx.client, query)]);
    } catch (error: unknown) {
      if (!isMissingAccount(error)) throw error;
      accountExists = false;
    }
    const status = verifyStatus({ accountExists, credential: credential?.entry, history, nowRippleSeconds: unixTimeToRippleTime(Date.now()) });
    const business =
      address === ctx.wallets.agent.address
        ? { name: DEMO_BUSINESS.registeredName, registration: DEMO_BUSINESS.registrationNumber, agentName: DEMO_AGENT_NAME }
        : undefined;
    return { examples, issuer, result: { kind: 'checked', address, status, business, credential, history } };
  });
}
