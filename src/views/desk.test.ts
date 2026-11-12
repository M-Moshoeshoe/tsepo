import { describe, expect, it } from 'vitest';
import { DepositReason, PolicyReason } from '../domain/reasons.ts';
import { applyFilter, countByFilter, itemsSince, parseDeskFilter, type DeskItem } from './desk.ts';
import { depositStatus, LEDGER_REJECTION_STATUS, refusalStatus } from './status.ts';

const items: DeskItem[] = [
  { at: '2026-11-12T16:00:00.000Z', status: depositStatus({ status: 'Cleared', reasons: [] }) },
  { at: '2026-11-12T23:00:00.000Z', status: refusalStatus([PolicyReason.SplitPaymentPattern]) },
  { at: '2026-11-12T10:00:00.000Z', status: depositStatus({ status: 'Held', reasons: [DepositReason.PackageMissing] }) },
  { at: '2026-11-12T16:30:00.000Z', status: LEDGER_REJECTION_STATUS },
];

describe('compliance desk views', () => {
  it('keeps only items since the last reset, newest first', () => {
    expect(itemsSince(items, '2026-11-12T16:00:00.000Z').map((item) => item.at)).toEqual([
      '2026-11-12T23:00:00.000Z',
      '2026-11-12T16:30:00.000Z',
      '2026-11-12T16:00:00.000Z',
    ]);
    expect(itemsSince(items, undefined)).toHaveLength(4);
  });

  it('counts each filter tab', () => {
    expect(countByFilter(items)).toEqual({ all: 4, cleared: 1, held: 1, refused: 1, rejected: 1 });
  });

  it('filters by category', () => {
    expect(applyFilter(items, 'refused').map((item) => item.status.chip)).toEqual(['Refused']);
    expect(applyFilter(items, 'all')).toHaveLength(4);
  });

  it('accepts only known filters', () => {
    expect(parseDeskFilter('refused')).toBe('refused');
    expect(parseDeskFilter('anything')).toBe('all');
    expect(parseDeskFilter(undefined)).toBe('all');
  });
});
