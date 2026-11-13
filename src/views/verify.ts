import { isAccepted, type CredentialEntry } from '../domain/credential-check.ts';

/** What "Verify an agent" can say about an address, from the ledger alone. */
export type VerifyStatus =
  | { state: 'verified'; acceptedAt: string | undefined; expiresAt: string | undefined }
  | { state: 'revoked'; at: string | undefined }
  | { state: 'not-verified'; reason: 'no-account' | 'no-credential' | 'not-accepted' | 'expired' };

/** Seconds between the Unix epoch and the Ripple epoch (1 January 2000). */
const RIPPLE_EPOCH = 946684800;

export function rippleTimeToIso(seconds: number): string {
  return new Date((seconds + RIPPLE_EPOCH) * 1000).toISOString();
}

export interface CredentialHistoryEvent {
  type: 'CredentialCreate' | 'CredentialAccept' | 'CredentialDelete';
  hash: string;
  closeTimeIso: string | undefined;
}

/**
 * Decides the status of an agent address. Fails closed: only an accepted,
 * unexpired Tšepo credential counts as verified. History is newest first.
 */
export function verifyStatus(input: {
  accountExists: boolean;
  credential: CredentialEntry | undefined;
  history: readonly CredentialHistoryEvent[];
  nowRippleSeconds: number;
}): VerifyStatus {
  if (!input.accountExists) return { state: 'not-verified', reason: 'no-account' };
  const { credential } = input;
  if (credential === undefined) {
    const latest = input.history[0];
    return latest?.type === 'CredentialDelete' ? { state: 'revoked', at: latest.closeTimeIso } : { state: 'not-verified', reason: 'no-credential' };
  }
  if (!isAccepted(credential.flags)) return { state: 'not-verified', reason: 'not-accepted' };
  if (credential.expiration === undefined || credential.expiration <= input.nowRippleSeconds) return { state: 'not-verified', reason: 'expired' };
  return {
    state: 'verified',
    acceptedAt: input.history.find((event) => event.type === 'CredentialAccept')?.closeTimeIso,
    expiresAt: rippleTimeToIso(credential.expiration),
  };
}

export const NOT_VERIFIED_TEXT: Record<Extract<VerifyStatus, { state: 'not-verified' }>['reason'], string> = {
  'no-account': 'This address has no account on the XRP Ledger Testnet.',
  'no-credential': 'This address holds no Tšepo credential. The agent deposit address would reject its payments.',
  'not-accepted': 'Tšepo issued a credential, but the agent has not accepted it yet, so it does not count.',
  expired: 'The credential has expired, so it no longer counts.',
};
