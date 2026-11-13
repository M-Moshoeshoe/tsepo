import { describe, expect, it } from 'vitest';
import type { PayoutRecord } from '../agent/records.ts';
import type { PolicyLogEntry } from '../policy/records.ts';
import { loadProof } from './proof.ts';
import { periodText, proofNumbers } from './proof-numbers.ts';

const proof = loadProof();
const revokedAt = proof.ledger.revocation.closeTime;

function review(at: string, decision: 'signed' | 'refused', reasons: string[] = [], invoiceId?: string): PolicyLogEntry {
  return { kind: 'review', at, decision, reasons, purpose: 'test', ...(invoiceId === undefined ? {} : { invoiceId }) };
}

function event(updatedAt: string, status: PayoutRecord['status'], invoiceId: string): PayoutRecord {
  return { reference: `REF-${invoiceId}`, status, invoiceId, reasons: [], updatedAt };
}

describe('proof in numbers', () => {
  it('counts every attempt that broke a rule, and finds each one blocked', () => {
    const numbers = proofNumbers({
      proof,
      policyLog: [
        review('2026-11-12T10:00:00.000Z', 'signed'),
        review('2026-11-12T10:01:00.000Z', 'refused', ['OVER_DAILY_LIMIT', 'SPLIT_PAYMENT_PATTERN'], 'C'),
        review('2026-11-12T10:01:30.000Z', 'refused', ['SERVICE_ERROR']),
      ],
      agentEvents: [{ reference: 'FRIEND-1', status: 'refused', reasons: ['PAYEE_UNKNOWN'], updatedAt: '2026-11-12T10:03:00.000Z' }],
      ledgerRejections: [{ hash: 'R1', at: '2026-11-12T10:02:00Z' }, { hash: 'R1', at: '2026-11-12T10:02:00Z' }],
      depositInvoices: [],
    });
    // The split, the unknown agent on the ledger (counted once) and the unapproved payee. A service error broke no rule.
    expect(numbers.rulesHeld).toEqual({ broke: 3, blocked: 3 });
    expect(numbers.period).toEqual({ from: '2026-11-12T10:00:00.000Z', to: '2026-11-12T10:03:00.000Z' });
  });

  it('does not count a refusal as blocked when its payment was paid anyway', () => {
    const refused = review('2026-11-12T10:01:00.000Z', 'refused', ['OVER_DAILY_LIMIT'], 'C');
    const paidByAgent = proofNumbers({ proof, policyLog: [refused], agentEvents: [event('2026-11-12T10:02:00.000Z', 'paid', 'C')], ledgerRejections: [], depositInvoices: [] });
    expect(paidByAgent.rulesHeld).toEqual({ broke: 1, blocked: 0 });
    const receivedByExchange = proofNumbers({ proof, policyLog: [refused], agentEvents: [], ledgerRejections: [], depositInvoices: ['C'] });
    expect(receivedByExchange.rulesHeld).toEqual({ broke: 1, blocked: 0 });
  });

  it('counts a payment as Travel Rule first only when its details were sent earlier', () => {
    const numbers = proofNumbers({
      proof,
      policyLog: [],
      agentEvents: [
        event('2026-11-12T10:00:00.000Z', 'package-sent', 'A'),
        event('2026-11-12T10:00:05.000Z', 'paid', 'A'),
        event('2026-11-12T10:01:05.000Z', 'paid', 'B'),
      ],
      ledgerRejections: [],
      depositInvoices: [],
    });
    expect(numbers.travelRule).toEqual({ first: 1, paid: 2 });
  });

  it('reads the signer list from the ledger evidence: the agent cannot reach the quorum alone', () => {
    const { signatures } = proofNumbers({ proof, policyLog: [], agentEvents: [], ledgerRejections: [], depositInvoices: [] });
    expect(signatures.agentWeight).toBeLessThan(signatures.quorum);
    expect(signatures.agentWeight + signatures.approvalWeight).toBe(signatures.quorum);
  });

  it('measures the first refusal for a missing credential after the revocation ledger closed', () => {
    const after = new Date(Date.parse(revokedAt) + 6600).toISOString();
    const before = new Date(Date.parse(revokedAt) - 60_000).toISOString();
    const numbers = proofNumbers({
      proof,
      policyLog: [review(before, 'refused', ['CREDENTIAL_MISSING']), review(after, 'refused', ['CREDENTIAL_MISSING'])],
      agentEvents: [],
      ledgerRejections: [],
      depositInvoices: [],
    });
    expect(numbers.revocation).toEqual({ ledgerIndex: proof.ledger.revocation.ledgerIndex, refusedAfterSeconds: 6.6 });
  });

  it('leaves out what the records cannot support', () => {
    const numbers = proofNumbers({ proof, policyLog: [], agentEvents: [], ledgerRejections: [], depositInvoices: [] });
    expect(numbers.rulesHeld).toBeUndefined();
    expect(numbers.travelRule).toBeUndefined();
    expect(numbers.period).toBeUndefined();
    expect(numbers.revocation.refusedAfterSeconds).toBeUndefined();
  });

  it('states the period briefly when both dates share a month', () => {
    expect(periodText('12 November 2026', '12 November 2026')).toBe('on 12 November 2026');
    expect(periodText('12 November 2026', '13 November 2026')).toBe('from 12 to 13 November 2026');
    expect(periodText('30 November 2026', '1 December 2026')).toBe('from 30 November 2026 to 1 December 2026');
  });
});
