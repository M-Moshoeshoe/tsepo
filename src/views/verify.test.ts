import { describe, expect, it } from 'vitest';
import { rippleTimeToIso, verifyStatus } from './verify.ts';

const ACCEPTED = 0x00010000;
const credential = { issuer: 'rIssuer', subject: 'rAgent', credentialType: 'AGENT_MANDATE', flags: ACCEPTED, expiration: 900_000_000, uri: 'sha256:abc' };
const history = [
  { type: 'CredentialAccept' as const, hash: 'B', closeTimeIso: '2026-11-12T10:00:10.000Z' },
  { type: 'CredentialCreate' as const, hash: 'A', closeTimeIso: '2026-11-12T10:00:00.000Z' },
];

describe('verify an agent', () => {
  it('verifies an accepted credential that has not expired', () => {
    expect(verifyStatus({ accountExists: true, credential, history, nowRippleSeconds: 800_000_000 })).toEqual({
      state: 'verified',
      acceptedAt: '2026-11-12T10:00:10.000Z',
      expiresAt: rippleTimeToIso(900_000_000),
    });
  });

  it('says revoked, with the time, when the latest event deleted the credential', () => {
    const revoked = [{ type: 'CredentialDelete' as const, hash: 'C', closeTimeIso: '2026-11-12T12:00:00.000Z' }, ...history];
    expect(verifyStatus({ accountExists: true, credential: undefined, history: revoked, nowRippleSeconds: 0 })).toEqual({
      state: 'revoked',
      at: '2026-11-12T12:00:00.000Z',
    });
  });

  it('fails closed: no account, no credential, not accepted or expired is not verified', () => {
    const base = { accountExists: true, history: [], nowRippleSeconds: 800_000_000 };
    expect(verifyStatus({ ...base, accountExists: false, credential: undefined })).toMatchObject({ reason: 'no-account' });
    expect(verifyStatus({ ...base, credential: undefined })).toMatchObject({ reason: 'no-credential' });
    expect(verifyStatus({ ...base, credential: { ...credential, flags: 0 } })).toMatchObject({ reason: 'not-accepted' });
    expect(verifyStatus({ ...base, credential: { ...credential, expiration: 1 } })).toMatchObject({ reason: 'expired' });
    expect(verifyStatus({ ...base, credential: { ...credential, expiration: undefined } })).toMatchObject({ reason: 'expired' });
  });

  it('converts Ripple time to ISO time', () => {
    expect(rippleTimeToIso(0)).toBe('2000-01-01T00:00:00.000Z');
  });
});
