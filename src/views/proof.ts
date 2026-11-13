import { z } from 'zod';
import { TESTNET_EXPLORER } from '../ledger/testnet.ts';
import data from './proof.json' with { type: 'json' };

/** The XRP Ledger features the landing page proves, each with one real Testnet transaction. */
export const PROOF_KEYS = [
  'credential-issued',
  'credential-accepted',
  'deposit-authorization',
  'signer-list',
  'approved-payment',
  'ledger-rejection',
  'revocation',
] as const;

export type ProofKey = (typeof PROOF_KEYS)[number];

const HashSchema = z.string().regex(/^[0-9A-F]{64}$/);

/** The committed evidence file, written by scripts/capture-proof.ts and checked here before the page uses it. */
export const ProofFileSchema = z.strictObject({
  capturedAt: z.iso.datetime(),
  network: z.literal('XRP Ledger Testnet'),
  transactions: z.record(z.enum(PROOF_KEYS), HashSchema),
});

export type ProofFile = z.infer<typeof ProofFileSchema>;

/** One plain line for each feature, in the order the story is told. */
export const PROOF_LINES: Record<ProofKey, { title: string; line: string }> = {
  'credential-issued': { title: 'Credential issued', line: 'Tšepo records the agent’s spending rules as a credential, holding only their fingerprint.' },
  'credential-accepted': { title: 'Credential accepted', line: 'The agent accepts the credential, so it now counts on the ledger.' },
  'deposit-authorization': {
    title: 'Deposit Authorization with credentials',
    line: 'The exchange’s deposit address accepts payments only from senders with a Tšepo credential.',
  },
  'signer-list': { title: 'Two keys to pay', line: 'The agent account needs the agent and the approval service to sign; its original key is off.' },
  'approved-payment': {
    title: 'An approved agent payment',
    line: 'RLUSD signed by the agent and the approval service, presenting the credential, tagged as agent activity.',
  },
  'ledger-rejection': { title: 'An unknown agent rejected', line: 'The XRP Ledger itself refused a payment from an agent without a credential: tecNO_PERMISSION.' },
  revocation: { title: 'An agent revoked', line: 'The business deletes the credential; from the next ledger, within seconds, the agent cannot pay.' },
};

export function loadProof(): ProofFile {
  return ProofFileSchema.parse(data);
}

export function explorerUrl(hash: string): string {
  return `${TESTNET_EXPLORER}/transactions/${hash}`;
}
