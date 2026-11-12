import { describe, expect, it } from 'vitest';
import { DepositReason, PolicyReason } from '../domain/reasons.ts';
import { applyFilter, countByFilter, itemsSince, parseDeskFilter, stoppedSummary, UNREGISTERED_AGENT, type DeskItem } from './desk.ts';
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

describe('stopped summary', () => {
  const unknown = 'rUnknownAgentAddress';
  const agent = 'rLesediAgentAddress';
  const entry = (status: ReturnType<typeof refusalStatus>, sender: string, senderName: string) => ({
    at: '2026-11-12T10:00:00Z',
    status,
    sender,
    senderName,
  });

  it('counts scenario 1 as one unregistered agent with two attempts', () => {
    const summary = stoppedSummary([
      entry(refusalStatus([PolicyReason.AgentNotRegistered]), unknown, UNREGISTERED_AGENT),
      entry(LEDGER_REJECTION_STATUS, unknown, UNREGISTERED_AGENT),
      entry(refusalStatus([PolicyReason.SplitPaymentPattern]), agent, 'Lesedi payout agent'),
      entry(depositStatus({ status: 'Cleared', reasons: [] }), agent, 'Lesedi payout agent'),
    ]);
    expect(summary).toEqual({
      attempts: 3,
      byPolicy: 2,
      byLedger: 1,
      sentence: '2 refused by the approval service, 1 rejected by the XRP Ledger. One unregistered agent made 2 of these attempts.',
    });
  });

  it('adds nothing about repeated attempts when there are none', () => {
    expect(stoppedSummary([]).sentence).toBe('0 refused by the approval service, 0 rejected by the XRP Ledger.');
  });
});
