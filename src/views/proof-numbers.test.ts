import { describe, expect, it } from 'vitest';
import type { PayoutRecord } from '../agent/records.ts';
import type { PolicyLogEntry } from '../policy/records.ts';
import { loadProof } from './proof.ts';
import { periodText, proofNumbers } from './proof-numbers.ts';

const proof = loadProof();
const revokedAt = proof.ledger.revocation.closeTime;

function review(at: string, decision: 'signed' | 'refused', reasons: string[] = []): PolicyLogEntry {
  return { kind: 'review', at, decision, reasons, purpose: 'test' };
}

function event(updatedAt: string, status: PayoutRecord['status'], invoiceId: string): PayoutRecord {
  return { reference: `REF-${invoiceId}`, status, invoiceId, reasons: [], updatedAt };
}

describe('proof in numbers', () => {
  it('counts refused and rejected attempts against every attempt', () => {
    const numbers = proofNumbers({
      proof,
      policyLog: [review('2026-11-12T10:00:00.000Z', 'signed'), review('2026-11-12T10:01:00.000Z', 'refused', ['OVER_DAILY_LIMIT'])],
      agentEvents: [],
      ledgerRejections: [{ hash: 'R1', at: '2026-11-12T10:02:00Z' }, { hash: 'R1', at: '2026-11-12T10:02:00Z' }],
    });
    // One signed, one refused, one ledger rejection counted once: 2 of 3 blocked.
    expect(numbers.attempts).toEqual({ blocked: 2, total: 3, percent: 67 });
    expect(numbers.period).toEqual({ from: '2026-11-12T10:00:00.000Z', to: '2026-11-12T10:02:00.000Z' });
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
    });
    expect(numbers.travelRule).toEqual({ first: 1, paid: 2 });
  });

  it('reads the signer list from the ledger evidence: the agent cannot reach the quorum alone', () => {
    const { signatures } = proofNumbers({ proof, policyLog: [], agentEvents: [], ledgerRejections: [] });
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
    });
    expect(numbers.revocation).toEqual({ ledgerIndex: proof.ledger.revocation.ledgerIndex, refusedAfterSeconds: 6.6 });
  });

  it('leaves out what the records cannot support', () => {
    const numbers = proofNumbers({ proof, policyLog: [], agentEvents: [], ledgerRejections: [] });
    expect(numbers.attempts).toBeUndefined();
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
