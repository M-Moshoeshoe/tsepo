import { describe, expect, it } from 'vitest';
import { loadProof } from './proof.ts';
import { NO_FIGURES_YET, proofFigures, proofSource } from './proof-figures.ts';
import { proofNumbers } from './proof-numbers.ts';

const proof = loadProof();
const EMPTY = proofNumbers({ proof, policyLog: [], agentEvents: [], ledgerRejections: [], depositInvoices: [] });

describe('the proof figures', () => {
  it('shows no figures and no zeros while the records are empty, as on a fresh deployment', () => {
    expect(proofFigures(EMPTY)).toEqual([]);
    expect(NO_FIGURES_YET).toBe('Figures appear as the agent runs.');
    expect(proofSource(EMPTY)).toBe('The figures count what the agent does on Testnet, and the table is read from the XRP Ledger itself.');
  });

  it('shows all four figures once the records hold blocked attempts and paid payments', () => {
    const numbers = proofNumbers({
      proof,
      policyLog: [{ kind: 'review', at: '2026-11-12T10:00:00.000Z', decision: 'refused', reasons: ['OVER_DAILY_LIMIT'], invoiceId: 'C', purpose: 'test' }],
      agentEvents: [
        { reference: 'A', status: 'package-sent', invoiceId: 'A', reasons: [], updatedAt: '2026-11-12T10:01:00.000Z' },
        { reference: 'A', status: 'paid', invoiceId: 'A', hash: 'H', reasons: [], updatedAt: '2026-11-12T10:01:05.000Z' },
      ],
      ledgerRejections: [],
      depositInvoices: ['A'],
    });
    const figures = proofFigures(numbers);
    expect(figures.map((figure) => figure.value)).toEqual(['1 of 1', '1 of 1', '1 of 2', 'Next ledger']);
    expect(figures[0]?.label).toBe('Every attempt that broke the rules was blocked.');
    expect(figures[2]?.label).toBe('The agent alone can never pay: it holds 1 of the 2 required signatures.');
    expect(figures.every((figure) => !/^0\b/.test(figure.value))).toBe(true);
  });
});
