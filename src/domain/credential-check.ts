/** The credential type Tšepo issues to agents. */
export const AGENT_MANDATE_CREDENTIAL_TYPE = 'AGENT_MANDATE';

/** Ledger flag set on a Credential once the subject has accepted it. */
const LSF_ACCEPTED = 0x00010000;

/** A Credential ledger entry with its hex fields already decoded. */
export interface CredentialEntry {
  issuer: string;
  subject: string;
  credentialType: string;
  flags: number;
  /** Seconds since the Ripple epoch, if set. */
  expiration?: number | undefined;
  uri?: string | undefined;
}

export interface CredentialExpectation {
  issuer: string;
  subject: string;
  credentialType: string;
  fingerprint: string;
}

export type CredentialCheck = { valid: true } | { valid: false; problems: string[] };

export function isAccepted(flags: number): boolean {
  return (flags & LSF_ACCEPTED) !== 0;
}

/**
 * Decides whether a credential proves a current mandate. Fails closed: a
 * credential without an expiry, or one that expires at this very second,
 * is treated as not valid.
 */
export function checkCredential(
  entry: CredentialEntry,
  expected: CredentialExpectation,
  nowRippleSeconds: number,
): CredentialCheck {
  const problems: string[] = [];

  if (entry.issuer !== expected.issuer) problems.push('issued by an unexpected account');
  if (entry.subject !== expected.subject) problems.push('held by an unexpected account');
  if (entry.credentialType !== expected.credentialType) problems.push('has an unexpected credential type');
  if (!isAccepted(entry.flags)) problems.push('has not been accepted by the agent');
  if (entry.expiration === undefined) problems.push('has no expiry');
  else if (entry.expiration <= nowRippleSeconds) problems.push('has expired');
  if (entry.uri !== expected.fingerprint) problems.push('does not match the mandate fingerprint');

  return problems.length === 0 ? { valid: true } : { valid: false, problems };
}
