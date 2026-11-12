import { describe, expect, it } from 'vitest';
import {
  AGENT_MANDATE_CREDENTIAL_TYPE,
  checkCredential,
  type CredentialEntry,
  type CredentialExpectation,
} from './credential-check.ts';

const now = 800_000_000;

const expected: CredentialExpectation = {
  issuer: 'rIssuer',
  subject: 'rAgent',
  credentialType: AGENT_MANDATE_CREDENTIAL_TYPE,
  fingerprint: 'sha256:abc',
};

const valid: CredentialEntry = {
  issuer: 'rIssuer',
  subject: 'rAgent',
  credentialType: AGENT_MANDATE_CREDENTIAL_TYPE,
  flags: 0x00010000,
  expiration: now + 60,
  uri: 'sha256:abc',
};

describe('checkCredential', () => {
  it('accepts an accepted, unexpired credential that matches the mandate', () => {
    expect(checkCredential(valid, expected, now)).toEqual({ valid: true });
  });

  it.each([
    ['not accepted', { flags: 0 }, 'has not been accepted by the agent'],
    ['expired', { expiration: now - 1 }, 'has expired'],
    ['expiring this second', { expiration: now }, 'has expired'],
    ['without expiry', { expiration: undefined }, 'has no expiry'],
    ['from another issuer', { issuer: 'rOther' }, 'issued by an unexpected account'],
    ['held by another account', { subject: 'rOther' }, 'held by an unexpected account'],
    ['of another type', { credentialType: 'KYC' }, 'has an unexpected credential type'],
    ['with another fingerprint', { uri: 'sha256:def' }, 'does not match the mandate fingerprint'],
  ])('rejects a credential %s', (_name, change, problem) => {
    const result = checkCredential({ ...valid, ...change }, expected, now);
    expect(result).toEqual({ valid: false, problems: [problem] });
  });
});
