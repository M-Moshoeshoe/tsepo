import { describe, expect, it } from 'vitest';
import { explorerUrl, loadProof, PROOF_KEYS, PROOF_LINES, shortHash } from './proof.ts';

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

  it('records the ledger result of every transaction, and only the unknown agent was rejected', () => {
    const proof = loadProof();
    for (const key of PROOF_KEYS) expect(proof.ledger[key].result, key).toBe(key === 'ledger-rejection' ? 'tecNO_PERMISSION' : 'tesSUCCESS');
  });

  it('shortens a hash to its first six and last four characters', () => {
    expect(shortHash('F862AD6451C2A67972A964E79FE3F0E6CD72E2EEBC50F810CFE3FE2D3C786800')).toBe('F862AD...6800');
  });
});
