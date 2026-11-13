import { describe, expect, it } from 'vitest';
import { defaultRange, parseReportRange, recordsInRange, reportFileName, toCsv, type DecisionRecord } from './reports.ts';

const NOW = new Date('2026-11-13T10:00:00.000Z');

function record(time: string, overrides: Partial<DecisionRecord> = {}): DecisionRecord {
  return {
    time,
    transactionHash: 'ABC',
    sender: 'rSender',
    originatorBusiness: 'Lesedi Design Studio (Pty) Ltd',
    originatorRegistration: '2021/482913/07',
    beneficiary: 'Naledi Mokoena',
    amount: '2',
    asset: 'RLUSD',
    travelRuleReference: 'F00D',
    outcome: 'Cleared',
    reasons: '',
    ...overrides,
  };
}

describe('decision reports for exchanges', () => {
  it('covers the last 30 days by default', () => {
    expect(defaultRange(NOW)).toEqual({ from: '2026-10-15', to: '2026-11-13' });
    expect(parseReportRange(undefined, '', NOW)).toEqual({ from: '2026-10-15', to: '2026-11-13' });
  });

  it('refuses a range that is not dates, runs backwards or is too long', () => {
    expect(parseReportRange('yesterday', '2026-11-13', NOW)).toEqual({ error: 'Choose the days as dates, such as 2026-11-01.' });
    expect(parseReportRange('2026-11-13', '2026-11-01', NOW)).toEqual({ error: 'The first day must come before the last day.' });
    expect(parseReportRange('2025-01-01', '2026-11-13', NOW)).toEqual({ error: 'Choose at most 366 days at a time.' });
  });

  it('keeps the records on the chosen days, counted in SAST, oldest first', () => {
    const late = record('2026-11-12T22:30:00.000Z');
    const early = record('2026-11-11T08:00:00.000Z');
    const outside = record('2026-11-10T21:59:00.000Z');
    expect(recordsInRange([late, outside, early], { from: '2026-11-11', to: '2026-11-13' })).toEqual([early, late]);
  });

  it('writes CSV with a header, quotes where needed, and never lets a cell run as a formula', () => {
    const csv = toCsv([record('2026-11-12T10:00:00.000Z', { reasons: 'Over the daily limit, split payment', beneficiary: '=HYPERLINK("x")' })]);
    const [header, row] = csv.split('\r\n');
    expect(header).toBe('Time (UTC),Transaction hash,Sender account,Originator business,Originator CIPC number,Beneficiary,Amount,Asset,Travel Rule reference,Outcome,Reasons');
    expect(row).toContain(`"'=HYPERLINK(""x"")"`);
    expect(row).toContain('"Over the daily limit, split payment"');
    expect(csv.endsWith('\r\n')).toBe(true);
  });

  it('names the file after its range', () => {
    expect(reportFileName({ from: '2026-11-01', to: '2026-11-13' }, 'csv')).toBe('tsepo-decisions-2026-11-01-to-2026-11-13.csv');
  });
});
