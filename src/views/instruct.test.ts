import { describe, expect, it } from 'vitest';
import { allowanceLine } from './instruct.ts';
import { dailyUsage } from './usage.ts';

describe("today's allowance", () => {
  it('says what is left today and the most per payment', () => {
    expect(allowanceLine({ state: 'active', usage: dailyUsage('2', '5'), perPaymentLimit: '3' })).toBe('Today: 3 of 5 RLUSD left. Up to 3 RLUSD per payment.');
    expect(allowanceLine({ state: 'active', usage: dailyUsage('6', '5'), perPaymentLimit: '3' })).toBe('Today: 0 of 5 RLUSD left. Up to 3 RLUSD per payment.');
  });

  it('says plainly when the agent cannot pay at all', () => {
    expect(allowanceLine({ state: 'revoked', usage: undefined, perPaymentLimit: undefined })).toContain('revoked, so it cannot pay');
    expect(allowanceLine({ state: 'not-registered', usage: undefined, perPaymentLimit: undefined })).toContain('no valid spending rules');
  });
});
