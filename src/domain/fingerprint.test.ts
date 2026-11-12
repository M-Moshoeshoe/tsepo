import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { canonicalJson, mandateFingerprint } from './fingerprint.ts';
import type { Mandate } from './mandate.ts';

const mandate: Mandate = {
  version: 1,
  principal: 'rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe',
  agent: 'rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh',
  approvedRecipients: ['rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1', 'rLHzPsX6oXkzU2qL12kHCH8G8cnZv1rBJh'],
  currency: 'RLUSD',
  perPaymentLimit: '5',
  dailyLimit: '20',
  expiresAt: '2026-12-31T23:59:59Z',
};

describe('canonicalJson', () => {
  it('sorts keys at every level and keeps array order', () => {
    expect(canonicalJson({ b: 1, a: { d: [2, 1], c: null } })).toBe('{"a":{"c":null,"d":[2,1]},"b":1}');
  });
});

describe('mandateFingerprint', () => {
  it('is sha256 of the canonical JSON with recipients sorted', () => {
    const expectedText =
      '{"agent":"rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",' +
      '"approvedRecipients":["rLHzPsX6oXkzU2qL12kHCH8G8cnZv1rBJh","rU6K7V3Po4snVhBBaU29sesqs2qTQJWDw1"],' +
      '"currency":"RLUSD","dailyLimit":"20","expiresAt":"2026-12-31T23:59:59Z",' +
      '"perPaymentLimit":"5","principal":"rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe","version":1}';
    const expected = `sha256:${createHash('sha256').update(expectedText).digest('hex')}`;

    expect(mandateFingerprint(mandate)).toBe(expected);
  });

  it('does not depend on the order of approved recipients', () => {
    const reordered = { ...mandate, approvedRecipients: [...mandate.approvedRecipients].reverse() };
    expect(mandateFingerprint(reordered)).toBe(mandateFingerprint(mandate));
  });

  it('changes when any limit changes', () => {
    expect(mandateFingerprint({ ...mandate, dailyLimit: '21' })).not.toBe(mandateFingerprint(mandate));
  });
});
