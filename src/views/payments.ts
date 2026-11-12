import type { PayoutIntent } from '../agent/payout-parser.ts';
import type { PayoutRecord, RunRecord } from '../agent/records.ts';
import { formatUnits, toUnits } from '../domain/amount.ts';
import { sastDay } from '../domain/time.ts';
import { payoutSteps, type PayoutActivity, type PayoutStep } from './activity.ts';
import { reasonText } from './status.ts';

/** What the business sees for one payment. It ends at ledger settlement; the exchange's own checks are not shown here. */
export type BusinessPaymentStatus = 'paid' | 'not-approved' | 'failed' | 'in-progress' | 'not-started';

export interface BusinessPayment {
  /** Unique across runs: the same reference can be paid again in a later run. */
  id: string;
  runId: string;
  /** When the instruction this payment came from was received. */
  instructionAt: string;
  /** When the payment last changed, or when its instruction arrived if nothing happened yet. */
  at: string;
  intent: PayoutIntent;
  status: BusinessPaymentStatus;
  reasons: string[];
  steps: PayoutStep[];
  hash: string | undefined;
  invoiceId: string | undefined;
}

export interface Instruction {
  runId: string;
  at: string;
  text: string;
  intents: PayoutIntent[];
  payments: BusinessPayment[];
}

const STATUS: Record<PayoutActivity['outcome'], BusinessPaymentStatus> = {
  paid: 'paid',
  refused: 'not-approved',
  failed: 'failed',
  'in-progress': 'in-progress',
  'not-started': 'not-started',
};

/** "1762958400000-INV-1042": the instruction's time in milliseconds, then the reference. Safe in an address. */
export function paymentId(runStartedAt: string, reference: string): string {
  return `${String(Date.parse(runStartedAt))}-${reference}`;
}

function byNewest<T extends { at: string }>(items: T[]): T[] {
  return items.sort((a, b) => b.at.localeCompare(a.at));
}

/**
 * Every instruction the agent received, newest first, each with its payments.
 * A payment's events are those recorded between its run's start and the next
 * run's start, so a reference paid again later never borrows a later result.
 */
export function instructionsFrom(runs: readonly RunRecord[], events: readonly PayoutRecord[]): Instruction[] {
  const ordered = [...runs].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
  const instructions = ordered.map((run, index) => {
    const end = ordered[index + 1]?.startedAt;
    const window = events.filter((event) => event.updatedAt >= run.startedAt && (end === undefined || event.updatedAt < end));
    const payments = run.intents.map((intent): BusinessPayment => {
      const own = window.filter((event) => event.reference === intent.reference);
      const { outcome, reasons, steps } = payoutSteps(own);
      const latest = own.reduce<PayoutRecord | undefined>((last, event) => (last === undefined || event.updatedAt > last.updatedAt ? event : last), undefined);
      const paid = own.find((event) => event.status === 'paid');
      return {
        id: paymentId(run.startedAt, intent.reference),
        runId: run.id,
        instructionAt: run.startedAt,
        at: latest?.updatedAt ?? run.startedAt,
        intent,
        status: STATUS[outcome],
        reasons,
        steps,
        hash: paid?.hash ?? latest?.hash,
        invoiceId: own.find((event) => event.invoiceId !== undefined)?.invoiceId,
      };
    });
    return { runId: run.id, at: run.startedAt, text: run.instruction, intents: run.intents, payments };
  });
  return byNewest(instructions);
}

/** One payment and the instruction it came from, by payment id. */
export function findPayment(instructions: readonly Instruction[], id: string | undefined): { payment: BusinessPayment; instruction: Instruction } | undefined {
  if (id === undefined) return undefined;
  for (const instruction of instructions) {
    const payment = instruction.payments.find((item) => item.id === id);
    if (payment !== undefined) return { payment, instruction };
  }
  return undefined;
}

/** Every payment from every instruction, newest first. */
export function paymentsFrom(instructions: readonly Instruction[]): BusinessPayment[] {
  return byNewest(instructions.flatMap((instruction) => instruction.payments));
}

export type StatusFilter = 'all' | 'paid' | 'not-approved' | 'failed';
export type DatePreset = 'today' | '7d' | '30d' | 'all';

export const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'paid', label: 'Paid' },
  { id: 'not-approved', label: 'Not approved' },
  { id: 'failed', label: 'Failed' },
];

export const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'all', label: 'All time' },
];

export interface PaymentQuery {
  status: StatusFilter;
  range: DatePreset;
  /** The payment open in the details panel, if any. */
  payment: string | undefined;
}

export const DEFAULT_RANGE: DatePreset = '7d';

function pick<T extends string>(options: { id: T }[], value: unknown, fallback: T): T {
  return options.find((option) => option.id === value)?.id ?? fallback;
}

/** Reads the filters from the address. Anything unknown falls back to the default, never to an error. */
export function parsePaymentQuery(params: Record<string, string | string[] | undefined>): PaymentQuery {
  const one = (key: string): string | undefined => (typeof params[key] === 'string' ? params[key] : undefined);
  const payment = one('payment');
  return {
    status: pick(STATUS_FILTERS, one('status'), 'all'),
    range: pick(DATE_PRESETS, one('range'), DEFAULT_RANGE),
    payment: payment !== undefined && /^\d{1,15}-[A-Za-z0-9-]{1,32}$/.test(payment) ? payment : undefined,
  };
}

/** An address on `path` with these filters; defaults are left out so addresses stay short. */
export function paymentsHref(path: string, query: Partial<PaymentQuery>): string {
  const params = new URLSearchParams();
  if (query.status !== undefined && query.status !== 'all') params.set('status', query.status);
  if (query.range !== undefined && query.range !== DEFAULT_RANGE) params.set('range', query.range);
  if (query.payment !== undefined) params.set('payment', query.payment);
  const text = params.toString();
  return text === '' ? path : `${path}?${text}`;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** True when `at` falls in the preset, counted in whole SAST days, today included. */
export function inRange(at: string, range: DatePreset, now: Date): boolean {
  if (range === 'all') return true;
  const days = range === 'today' ? 1 : range === '7d' ? 7 : 30;
  const first = sastDay(new Date(now.getTime() - (days - 1) * DAY_MS));
  return sastDay(new Date(at)) >= first;
}

function matchesStatus(payment: BusinessPayment, status: StatusFilter): boolean {
  return status === 'all' || payment.status === status;
}

/** The payments under the filters, and the count for each status within the date range. */
export function filterPayments(
  payments: readonly BusinessPayment[],
  query: Pick<PaymentQuery, 'status' | 'range'>,
  now: Date,
): { shown: BusinessPayment[]; counts: Record<StatusFilter, number>; paidTotal: string } {
  const inPeriod = payments.filter((payment) => inRange(payment.at, query.range, now));
  const counts = Object.fromEntries(
    STATUS_FILTERS.map((filter) => [filter.id, inPeriod.filter((payment) => matchesStatus(payment, filter.id)).length]),
  ) as Record<StatusFilter, number>;
  const shown = inPeriod.filter((payment) => matchesStatus(payment, query.status));
  const paidUnits = shown.filter((payment) => payment.status === 'paid').reduce((sum, payment) => sum + toUnits(payment.intent.amount), 0n);
  return { shown, counts, paidTotal: formatUnits(paidUnits) };
}

/**
 * The decision on a payment in one plain sentence, and who made it. Never
 * Thuso: the approval service decides, and the XRP Ledger settles or rejects.
 */
export function paymentDecision(payment: Pick<BusinessPayment, 'status' | 'reasons'>): { text: string; decidedBy: string } | undefined {
  const first = payment.reasons[0];
  const why = first === undefined ? 'no reason was recorded' : reasonText(first);
  switch (payment.status) {
    case 'paid':
      return { text: 'Approved by the approval service and settled on the XRP Ledger.', decidedBy: 'the approval service' };
    case 'not-approved':
      return { text: `Not approved: ${why}.`, decidedBy: 'the approval service' };
    case 'failed':
      return { text: `Did not complete: ${why}.`, decidedBy: 'the XRP Ledger' };
    case 'in-progress':
    case 'not-started':
      return undefined;
  }
}

export const STATUS_LABELS: Record<BusinessPaymentStatus, string> = {
  paid: 'Paid',
  'not-approved': 'Not approved',
  failed: 'Failed',
  'in-progress': 'In progress',
  'not-started': 'Not started',
};

export const STATUS_TONES: Record<BusinessPaymentStatus, 'cleared' | 'refused' | 'neutral'> = {
  paid: 'cleared',
  'not-approved': 'refused',
  failed: 'refused',
  'in-progress': 'neutral',
  'not-started': 'neutral',
};
