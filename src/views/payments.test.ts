import { describe, expect, it } from 'vitest';
import type { PayoutRecord, RunRecord } from '../agent/records.ts';
import { PolicyReason } from '../domain/reasons.ts';
import {
  filterPayments,
  instructionsFrom,
  parsePaymentQuery,
  paymentDecision,
  paymentId,
  paymentsFrom,
  paymentsHref,
  spendByDay,
} from './payments.ts';
import { inRange } from './date-range.ts';
import { totalsClearedToday } from './usage.ts';

const HASH_A = 'A'.repeat(64);
const HASH_B = 'B'.repeat(64);

const naledi = { payee: 'Naledi Mokoena', amount: '2', purpose: 'Logo design', reference: 'INV-1042' };
const split = ['A', 'B', 'C'].map((part) => ({ payee: 'Thabo Nkosi', amount: '2', purpose: 'Website build', reference: `INV-2001-${part}` }));

function run(startedAt: string, intents: RunRecord['intents']): RunRecord {
  return { id: startedAt, startedAt, instruction: `instruction at ${startedAt}`, intents };
}

function event(reference: string, status: PayoutRecord['status'], updatedAt: string, extra: Partial<PayoutRecord> = {}): PayoutRecord {
  return { reference, status, reasons: [], updatedAt, ...extra };
}

const first = run('2026-11-12T10:00:00.000Z', [naledi]);
const second = run('2026-11-12T11:00:00.000Z', split);
const third = run('2026-11-12T12:00:00.000Z', [naledi]);

const events: PayoutRecord[] = [
  event('INV-1042', 'package-sent', '2026-11-12T10:00:01.000Z', { invoiceId: 'F1' }),
  event('INV-1042', 'signed', '2026-11-12T10:00:02.000Z', { invoiceId: 'F1', hash: HASH_A }),
  event('INV-1042', 'paid', '2026-11-12T10:00:05.000Z', { invoiceId: 'F1', hash: HASH_A }),
  event('INV-2001-A', 'paid', '2026-11-12T11:00:05.000Z', { hash: HASH_B }),
  event('INV-2001-B', 'paid', '2026-11-12T11:00:09.000Z', { hash: HASH_B }),
  event('INV-2001-C', 'package-sent', '2026-11-12T11:00:10.000Z', { invoiceId: 'F3' }),
  event('INV-2001-C', 'refused', '2026-11-12T11:00:11.000Z', {
    invoiceId: 'F3',
    reasons: [PolicyReason.OverDailyLimit, PolicyReason.SplitPaymentPattern],
  }),
  // The same reference, refused in a later run after a revocation.
  event('INV-1042', 'package-sent', '2026-11-12T12:00:01.000Z', { invoiceId: 'F4' }),
  event('INV-1042', 'refused', '2026-11-12T12:00:02.000Z', { invoiceId: 'F4', reasons: [PolicyReason.CredentialMissing] }),
];

describe('business payments', () => {
  const instructions = instructionsFrom([third, first, second], events);
  const payments = paymentsFrom(instructions);

  it('lists instructions newest first, each with its own payments', () => {
    expect(instructions.map((instruction) => instruction.at)).toEqual([third.startedAt, second.startedAt, first.startedAt]);
    expect(instructions[1]?.payments.map((payment) => payment.intent.reference)).toEqual(['INV-2001-A', 'INV-2001-B', 'INV-2001-C']);
  });

  it('keeps a reference paid in one run apart from the same reference refused in a later run', () => {
    const naledis = payments.filter((payment) => payment.intent.reference === 'INV-1042');
    expect(naledis.map((payment) => payment.status)).toEqual(['not-approved', 'paid']);
    expect(naledis[1]).toMatchObject({ hash: HASH_A, invoiceId: 'F1' });
    expect(naledis[0]?.invoiceId).toBe('F4');
  });

  it('gives each payment an id that is unique across runs and safe in an address', () => {
    const ids = payments.map((payment) => payment.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(paymentId(first.startedAt, 'INV-1042')).toBe(`${String(Date.parse(first.startedAt))}-INV-1042`);
    for (const id of ids) expect(parsePaymentQuery({ payment: id }).payment).toBe(id);
  });

  it('marks a payment refused by the approval service as not approved, with its reasons', () => {
    const refused = payments.find((payment) => payment.intent.reference === 'INV-2001-C');
    expect(refused).toMatchObject({ status: 'not-approved', reasons: [PolicyReason.OverDailyLimit, PolicyReason.SplitPaymentPattern] });
    expect(refused?.steps.map((step) => step.state)).toEqual(['done', 'failed', 'not-reached', 'failed']);
  });

  it('shows a payment with no events yet as not started', () => {
    const waiting = paymentsFrom(instructionsFrom([run('2026-11-12T13:00:00.000Z', [naledi])], []));
    expect(waiting[0]).toMatchObject({ status: 'not-started', at: '2026-11-12T13:00:00.000Z' });
  });
});

describe('payment filters', () => {
  const payments = paymentsFrom(instructionsFrom([first, second, third], events));
  const now = new Date('2026-11-12T20:00:00.000Z');

  it('counts each status within the date range and totals what was paid', () => {
    const result = filterPayments(payments, { status: 'all', range: 'today' }, now);
    expect(result.counts).toEqual({ all: 5, paid: 3, 'not-approved': 2, failed: 0 });
    expect(result.paidTotal).toBe('6');
    expect(filterPayments(payments, { status: 'not-approved', range: 'today' }, now).shown).toHaveLength(2);
  });

  it('counts days in SAST, so 23:30 UTC is already tomorrow', () => {
    expect(inRange('2026-11-12T21:59:00.000Z', 'today', new Date('2026-11-12T22:30:00.000Z'))).toBe(false);
    expect(inRange('2026-11-12T22:01:00.000Z', 'today', new Date('2026-11-12T22:30:00.000Z'))).toBe(true);
    expect(inRange('2026-11-06T00:00:00.000Z', '7d', now)).toBe(true);
    expect(inRange('2026-11-05T21:00:00.000Z', '7d', now)).toBe(false);
  });

  it('reads unknown filters from the address as the defaults', () => {
    expect(parsePaymentQuery({ status: 'nonsense', range: ['7d', '30d'], payment: '<script>' })).toEqual({
      status: 'all',
      range: '7d',
      payment: undefined,
    });
  });

  it('builds short addresses that leave out the defaults', () => {
    expect(paymentsHref('/business/payments', { status: 'all', range: '7d' })).toBe('/business/payments');
    expect(paymentsHref('/business/payments', { status: 'paid', range: 'today', payment: 'x' })).toBe(
      '/business/payments?status=paid&range=today&payment=x',
    );
  });
});

describe('spending by day', () => {
  it('sums paid amounts per SAST day over 14 days, with empty days at zero', () => {
    const payments = paymentsFrom(instructionsFrom([first, second, third], events));
    const series = spendByDay(payments, new Date('2026-11-12T20:00:00.000Z'));
    expect(series).toHaveLength(14);
    expect(series[0]).toEqual({ day: '2026-10-30', paid: '0' });
    // Three paid payments of 2 RLUSD; the refused ones moved no money.
    expect(series.at(-1)).toEqual({ day: '2026-11-12', paid: '6' });
    expect(series.at(-1)?.paid).toBe(filterPayments(payments, { status: 'all', range: 'today' }, new Date('2026-11-12T20:00:00.000Z')).paidTotal);
  });
});

describe('the decision on a payment', () => {
  it('names the approval service or the ledger, in one plain sentence', () => {
    expect(paymentDecision({ status: 'paid', reasons: [] })).toEqual({
      text: 'Approved by the approval service and settled on the XRP Ledger.',
      decidedBy: 'the approval service',
    });
    expect(paymentDecision({ status: 'not-approved', reasons: [PolicyReason.RecipientNotApproved] })).toEqual({
      text: 'Not approved: the recipient is not approved.',
      decidedBy: 'the approval service',
    });
    expect(paymentDecision({ status: 'failed', reasons: ['tecPATH_PARTIAL'] })?.decidedBy).toBe('the XRP Ledger');
    expect(paymentDecision({ status: 'in-progress', reasons: [] })).toBeUndefined();
  });
});

describe('the today meter note', () => {
  const cleared = (at: string) => ({ kind: 'admin' as const, at, action: 'clear-daily-totals-for-demo', decision: 'applied' as const, reasons: [] });

  it('finds the latest clearing of the sample totals today, in SAST', () => {
    const log = [cleared('2026-11-12T09:00:00.000Z'), cleared('2026-11-12T11:00:00.000Z'), cleared('2026-11-11T11:00:00.000Z')];
    expect(totalsClearedToday(log, new Date('2026-11-12T20:00:00.000Z'))).toBe('2026-11-12T11:00:00.000Z');
    expect(totalsClearedToday(log, new Date('2026-11-13T20:00:00.000Z'))).toBeUndefined();
  });
});
