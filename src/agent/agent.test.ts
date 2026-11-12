import { describe, expect, it } from 'vitest';
import { createPayeeDirectory } from './payee-directory.ts';
import { MAX_PAYOUTS, validatePayoutIntents } from './payout-parser.ts';

const valid = { payee: 'Naledi Mokoena', amount: '2', purpose: 'Logo design', reference: 'INV-1042' };

describe('validatePayoutIntents', () => {
  it('accepts well-formed payouts', () => {
    expect(validatePayoutIntents([valid])).toEqual([valid]);
  });

  it.each([
    ['an amount with a currency', { amount: '2 RLUSD' }],
    ['a negative amount', { amount: '-2' }],
    ['a zero amount', { amount: '0' }],
    ['a reference with spaces', { reference: 'INV 1042' }],
    ['an empty reference', { reference: '' }],
    ['an empty payee', { payee: ' ' }],
    ['an extra field', { destination: 'rSomewhere' }],
  ])('rejects the whole list when one payout has %s', (_name, change) => {
    expect(() => validatePayoutIntents([valid, { ...valid, ...change }])).toThrow();
  });

  it('rejects more payouts than allowed', () => {
    expect(() => validatePayoutIntents(Array.from({ length: MAX_PAYOUTS + 1 }, () => valid))).toThrow();
  });

  it('rejects output that is not a list', () => {
    expect(() => validatePayoutIntents({ payouts: [valid] })).toThrow();
  });
});

describe('payee directory', () => {
  const directory = createPayeeDirectory([
    { name: 'Naledi Mokoena', ledgerAddress: 'rLane', destinationTag: 1001 },
    { name: 'Thabo Nkosi', ledgerAddress: 'rLane', destinationTag: 1002 },
  ]);

  it('resolves a known payee regardless of case and spacing', () => {
    expect(directory.resolve('  naledi   MOKOENA ')?.destinationTag).toBe(1001);
  });

  it('does not resolve an unknown payee or an address written in the list', () => {
    expect(directory.resolve('Unknown Person')).toBeUndefined();
    expect(directory.resolve('rLane')).toBeUndefined();
  });
});
