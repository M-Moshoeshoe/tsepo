import { describe, expect, it } from 'vitest';
import { requiredBalanceDrops } from './reserve.ts';

const reserves = { baseDrops: 1_000_000, ownerDrops: 200_000 };

describe('requiredBalanceDrops', () => {
  it('adds the base reserve, one owner reserve per object and the fee buffer', () => {
    expect(requiredBalanceDrops(reserves, 3, 1_000_000)).toBe(2_600_000);
  });

  it('needs only the base reserve and buffer for an account with no objects', () => {
    expect(requiredBalanceDrops(reserves, 0, 0)).toBe(1_000_000);
  });

  it('rejects a negative or fractional object count', () => {
    expect(() => requiredBalanceDrops(reserves, -1, 0)).toThrow();
    expect(() => requiredBalanceDrops(reserves, 1.5, 0)).toThrow();
  });
});
