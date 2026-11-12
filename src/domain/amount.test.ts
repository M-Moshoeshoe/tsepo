import { describe, expect, it } from 'vitest';
import { DecimalAmountSchema, formatUnits, toUnits } from './amount.ts';

describe('toUnits and formatUnits', () => {
  it.each([
    ['2', 2_000_000n],
    ['0.5', 500_000n],
    ['3.000001', 3_000_001n],
  ])('converts %s exactly', (text, units) => {
    expect(toUnits(text)).toBe(units);
    expect(formatUnits(units)).toBe(text);
  });

  it('adds without floating point error', () => {
    expect(formatUnits(toUnits('0.1') + toUnits('0.2'))).toBe('0.3');
  });

  it.each(['', '-1', '1e3', '01', '1.', '1.1234567', ' 2'])('rejects %j', (text) => {
    expect(() => toUnits(text)).toThrow();
  });
});

describe('DecimalAmountSchema', () => {
  it('accepts a positive amount', () => {
    expect(DecimalAmountSchema.parse('2')).toBe('2');
  });

  it('rejects zero', () => {
    expect(DecimalAmountSchema.safeParse('0').success).toBe(false);
  });
});
