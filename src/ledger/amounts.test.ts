import { describe, expect, it } from 'vitest';
import { currencyName, describeAmount } from './amounts.ts';
import { RLUSD } from './testnet.ts';

describe('describeAmount', () => {
  it('reads XRP in drops', () => {
    expect(describeAmount('100000000')).toEqual({ value: '100', asset: 'XRP' });
    expect(describeAmount('1500000')).toEqual({ value: '1.5', asset: 'XRP' });
  });

  it('names RLUSD from its hex currency code', () => {
    expect(describeAmount({ currency: RLUSD.currency, issuer: RLUSD.issuer, value: '2' })).toEqual({ value: '2', asset: 'RLUSD' });
  });

  it('keeps three letter codes', () => {
    expect(currencyName('USD')).toBe('USD');
  });

  it('returns undefined for anything that is not an amount', () => {
    expect(describeAmount(undefined)).toBeUndefined();
    expect(describeAmount({ value: '2' })).toBeUndefined();
    expect(describeAmount('-5')).toBeUndefined();
  });
});
