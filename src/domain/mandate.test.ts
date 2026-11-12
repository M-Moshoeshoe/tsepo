import { describe, expect, it } from 'vitest';
import { makeMandate, makeParties } from '../../test/fixtures.ts';
import { MandateSchema, withLimits } from './mandate.ts';

describe('changing mandate limits', () => {
  const mandate = makeMandate(makeParties());

  it('takes only the two limits, so a request kind can never enter the mandate', () => {
    const request = { kind: 'change-limits', perPaymentLimit: '3', dailyLimit: '6' };
    const changed = withLimits(mandate, request);
    expect(changed).toEqual({ ...mandate, dailyLimit: '6' });
    expect(Object.keys(changed)).not.toContain('kind');
    expect(MandateSchema.safeParse(changed).success).toBe(true);
  });

  it('rejects limits that are not plain positive amounts', () => {
    expect(() => withLimits(mandate, { perPaymentLimit: '0', dailyLimit: '5' })).toThrow();
    expect(() => withLimits(mandate, { perPaymentLimit: '3', dailyLimit: '1e3' })).toThrow();
  });
});
