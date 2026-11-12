import { describe, expect, it } from 'vitest';
import { DepositReason, PolicyReason } from '../domain/reasons.ts';
import { DATE_PRESETS, dayLabels, daysInRange, MAX_CHART_DAYS } from './date-range.ts';
import { applyFilter, countByFilter, DESK_FILTERS, itemsInRange, outcomesByDay, OUTCOMES, parseDeskFilter, type DeskItem } from './desk.ts';
import { depositStatus, LEDGER_REJECTION_STATUS, refusalStatus } from './status.ts';
import { TRAVEL_RULE_LABELS, travelRuleTiming } from './travel-rule.ts';

const now = new Date('2026-11-12T20:00:00.000Z');
const accepted = depositStatus({ status: 'Cleared', reasons: [] });
const held = depositStatus({ status: 'Held', reasons: [DepositReason.PackageMissing] });
const announced = refusalStatus([PolicyReason.SplitPaymentPattern]);

const items: DeskItem[] = [
  { at: '2026-11-12T16:00:00.000Z', status: accepted },
  { at: '2026-11-12T19:00:00.000Z', status: announced },
  { at: '2026-11-12T10:00:00.000Z', status: held },
  { at: '2026-11-12T16:30:00.000Z', status: LEDGER_REJECTION_STATUS },
  { at: '2026-11-10T09:00:00.000Z', status: accepted },
  { at: '2026-11-09T09:00:00.000Z', status: announced },
  { at: '2026-10-01T09:00:00.000Z', status: accepted },
];

describe('incoming payments views', () => {
  it('uses plain outcome names on the filters', () => {
    expect(DESK_FILTERS.map((filter) => filter.label)).toEqual(['All', 'Accepted', 'Held for review', 'Announced, not sent', 'Rejected by the ledger']);
  });

  it('keeps items in the date range, newest first, counting days in SAST', () => {
    expect(itemsInRange(items, 'today', now).map((item) => item.at)).toEqual([
      '2026-11-12T19:00:00.000Z',
      '2026-11-12T16:30:00.000Z',
      '2026-11-12T16:00:00.000Z',
      '2026-11-12T10:00:00.000Z',
    ]);
    expect(itemsInRange(items, '7d', now)).toHaveLength(6);
    expect(itemsInRange(items, 'all', now)).toHaveLength(7);
  });

  it('counts each filter and filters by outcome', () => {
    expect(countByFilter(items)).toEqual({ all: 7, cleared: 3, held: 1, refused: 2, rejected: 1 });
    expect(applyFilter(items, 'refused').map((item) => item.status.chip)).toEqual(['Announced, not sent', 'Announced, not sent']);
  });

  it('accepts only known filters', () => {
    expect(parseDeskFilter('refused')).toBe('refused');
    expect(parseDeskFilter('anything')).toBe('all');
    expect(parseDeskFilter(undefined)).toBe('all');
  });
});

describe('the outcomes chart', () => {
  it('has totals equal to the list counts for every date range', () => {
    for (const { id: range } of DATE_PRESETS) {
      const { days, totals } = outcomesByDay(items, range, now);
      const counts = countByFilter(itemsInRange(items, range, now));
      for (const outcome of OUTCOMES) {
        expect(totals[outcome], `${range} ${outcome}`).toBe(counts[outcome]);
        expect(days.reduce((sum, day) => sum + day.counts[outcome], 0), `${range} ${outcome} bars`).toBe(counts[outcome]);
      }
    }
  });

  it('draws every day of the range, oldest first, even the empty ones', () => {
    const { days } = outcomesByDay(items, '7d', now);
    expect(days.map((day) => day.day)).toEqual(['2026-11-06', '2026-11-07', '2026-11-08', '2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12']);
    expect(days[0]?.counts).toEqual({ cleared: 0, held: 0, refused: 0, rejected: 0 });
    expect(days.at(-1)?.counts).toEqual({ cleared: 1, held: 1, refused: 1, rejected: 1 });
  });

  it('starts "all time" at the earliest item, and never draws more than the cap', () => {
    expect(daysInRange('all', now, '2026-11-10T09:00:00.000Z')).toEqual(['2026-11-10', '2026-11-11', '2026-11-12']);
    expect(daysInRange('all', now, '2025-01-01T00:00:00.000Z')).toHaveLength(MAX_CHART_DAYS);
    expect(daysInRange('all', now, undefined)).toEqual(['2026-11-12']);
  });

  it('labels days for the axis and the table', () => {
    expect(dayLabels('2026-11-12')).toEqual({ short: '12 Nov', full: '12 November 2026' });
  });
});

describe('Travel Rule timing', () => {
  it('says when the details arrived relative to the payment', () => {
    expect(travelRuleTiming('deposit', [], true)).toBe('before');
    expect(travelRuleTiming('deposit', [DepositReason.PackageAfterPayment], true)).toBe('after');
    expect(travelRuleTiming('deposit', [DepositReason.PackageMissing], false)).toBe('missing');
    expect(travelRuleTiming('refusal', [PolicyReason.SplitPaymentPattern], true)).toBe('no-payment');
    expect(travelRuleTiming('rejection', [], false)).toBe('missing');
    expect(TRAVEL_RULE_LABELS.before).toBe('Received before the payment');
  });
});
