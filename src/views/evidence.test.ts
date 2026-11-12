import { describe, expect, it } from 'vitest';
import { PolicyReason } from '../domain/reasons.ts';
import { evidenceFileName, paymentEvidence, PaymentEvidenceSchema } from './evidence.ts';
import type { BusinessPayment } from './payments.ts';

const HASH = 'C'.repeat(64);

function payment(overrides: Partial<BusinessPayment> = {}): BusinessPayment {
  return {
    id: '1-INV-1042',
    runId: '2026-11-12T10:00:00.000Z',
    instructionAt: '2026-11-12T10:00:00.000Z',
    at: '2026-11-12T10:00:05.000Z',
    intent: { payee: 'Naledi Mokoena', amount: '2', purpose: 'Logo design', reference: 'INV-1042' },
    status: 'paid',
    reasons: [],
    steps: [
      { id: 'package', label: 'Travel Rule details sent', state: 'done' },
      { id: 'result', label: 'Settled on the XRP Ledger', state: 'done', hash: HASH },
    ],
    hash: HASH,
    invoiceId: 'F1',
    ...overrides,
  };
}

const base = {
  instructionText: 'Please pay Naledi Mokoena 2 RLUSD.',
  business: { name: 'Lesedi Design Studio (Pty) Ltd', ledgerAddress: 'rBusiness' },
  agent: { name: 'Lesedi payout agent', ledgerAddress: 'rAgent' },
  now: new Date('2026-11-12T12:00:00.000Z'),
};

const review = (invoiceId: string, decision: 'signed' | 'refused', at: string, reasons: string[] = []) => ({
  kind: 'review' as const,
  at,
  decision,
  reasons,
  invoiceId,
  purpose: 'Logo design',
});

describe('payment evidence', () => {
  it('holds the payment, the decisions for its Travel Rule reference only, and the ledger link', () => {
    const evidence = paymentEvidence({
      ...base,
      payment: payment(),
      policyLog: [review('F1', 'signed', '2026-11-12T10:00:02.000Z'), review('OTHER', 'refused', '2026-11-12T10:00:03.000Z')],
    });
    expect(PaymentEvidenceSchema.parse(evidence)).toEqual(evidence);
    expect(evidence.approvalDecisions).toEqual([{ at: '2026-11-12T10:00:02.000Z', decision: 'signed', reasons: [] }]);
    expect(evidence.ledger?.explorerUrl).toBe(`https://testnet.xrpl.org/transactions/${HASH}`);
    expect(evidence.payment).toMatchObject({ status: 'Paid', recipient: 'Naledi Mokoena', currency: 'RLUSD' });
  });

  it('explains each reason code in words and has no ledger link for a payment that was not paid', () => {
    const evidence = paymentEvidence({
      ...base,
      payment: payment({ status: 'not-approved', reasons: [PolicyReason.OverDailyLimit], hash: undefined }),
      policyLog: [],
    });
    expect(evidence.ledger).toBeNull();
    expect(evidence.payment.reasons).toEqual([{ code: PolicyReason.OverDailyLimit, text: 'the payment would go over the daily limit' }]);
  });

  it('refuses to build a file around a malformed hash', () => {
    expect(() => paymentEvidence({ ...base, payment: payment({ hash: 'not-a-hash' }), policyLog: [] })).toThrow();
  });

  it('names the file after the reference and the day', () => {
    expect(evidenceFileName('INV-1042', '2026-11-12T10:00:00.000Z')).toBe('tsepo-evidence-INV-1042-2026-11-12.json');
  });
});
