import { describe, expect, it } from 'vitest';
import { EXAMPLE_PAYMENTS_CENTS, feeBound, feePerSideCents, formatRand, formatRandMillions, monthlyFees } from './pricing.ts';

describe('pilot pricing', () => {
  it('charges 0.25% per side, with a minimum of R0.50 and a maximum of R25', () => {
    expect(feePerSideCents(5_000)).toBe(50);
    expect(feePerSideCents(200_000)).toBe(500);
    expect(feePerSideCents(5_000_000)).toBe(2500);
    expect(feePerSideCents(1_000_000)).toBe(2500);
    expect(feePerSideCents(20_000)).toBe(50);
    expect(feePerSideCents(40_000)).toBe(100);
  });

  it('says which bound set the fee', () => {
    expect(EXAMPLE_PAYMENTS_CENTS.map(feeBound)).toEqual(['minimum', undefined, 'cap']);
  });

  it('refuses a payment that is not a positive whole number of cents', () => {
    for (const bad of [0, -100, 10.5]) expect(() => feePerSideCents(bad)).toThrow(RangeError);
  });

  it('writes rands the South African way', () => {
    expect([50, 500, 2500, 5_000, 200_000, 1_000_000, 200_000_000].map(formatRand)).toEqual(['R0.50', 'R5', 'R25', 'R50', 'R2,000', 'R10,000', 'R2,000,000']);
  });

  it('names whole millions in words', () => {
    expect(formatRandMillions(200_000_000)).toBe('R2 million');
    expect(formatRandMillions(250_000)).toBe('R2,500');
  });

  it('works out the illustration: 1,000 payments of R2,000 a month', () => {
    expect(monthlyFees(1_000, 200_000)).toEqual({ volumeCents: 200_000_000, perSideCents: 500_000, totalCents: 1_000_000 });
  });
});
