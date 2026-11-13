import { describe, expect, it } from 'vitest';
import { explorerUrl, loadProof, PROOF_KEYS, PROOF_LINES } from './proof.ts';

describe('Proven on Testnet', () => {
  it('has a committed transaction for every feature, in the right shape', () => {
    const proof = loadProof();
    expect(Object.keys(proof.transactions).sort()).toEqual([...PROOF_KEYS].sort());
  });

  it('says what each feature proves in one plain line', () => {
    for (const key of PROOF_KEYS) {
      expect(PROOF_LINES[key].line).not.toMatch(/\b\w+n't\b|[–—]/);
    }
    expect(explorerUrl('A'.repeat(64))).toBe(`https://testnet.xrpl.org/transactions/${'A'.repeat(64)}`);
  });
});
