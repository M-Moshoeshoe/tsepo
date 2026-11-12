import { describe, expect, it } from 'vitest';
import { paginate, parsePage } from './pagination.ts';
import { instructionOutcome } from './payments.ts';
import { readSummary } from './assistant.ts';

const rows = Array.from({ length: 34 }, (_, index) => index + 1);

describe('pagination', () => {
  it('shows ten rows a page with a plain range label', () => {
    expect(paginate(rows, 1)).toMatchObject({ page: 1, pageCount: 4, total: 34, label: '1 to 10 of 34' });
    expect(paginate(rows, 2).items).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19, 20]);
    expect(paginate(rows, 2).label).toBe('11 to 20 of 34');
    expect(paginate(rows, 4)).toMatchObject({ label: '31 to 34 of 34', items: [31, 32, 33, 34] });
  });

  it('shows the last page for a page past the end, and says when there is nothing', () => {
    expect(paginate(rows, 99).page).toBe(4);
    expect(paginate([], 3)).toMatchObject({ page: 1, pageCount: 1, label: 'No entries', items: [] });
  });

  it('reads only whole page numbers from the address', () => {
    expect(parsePage('3')).toBe(3);
    expect(parsePage('0')).toBe(1);
    expect(parsePage('-2')).toBe(1);
    expect(parsePage('2.5')).toBe(1);
    expect(parsePage(['2'])).toBe(1);
    expect(parsePage(undefined)).toBe(1);
  });
});

describe('the instructions inbox', () => {
  const intent = (payee: string, amount: string, reference: string) => ({ payee, amount, purpose: 'Work', reference });

  it('gives each instruction one outcome', () => {
    expect(instructionOutcome([{ status: 'paid' }])).toEqual({ label: 'Paid', tone: 'cleared' });
    expect(instructionOutcome([{ status: 'paid' }, { status: 'paid' }])).toEqual({ label: 'All paid', tone: 'cleared' });
    expect(instructionOutcome([{ status: 'paid' }, { status: 'paid' }, { status: 'not-approved' }])).toEqual({ label: '2 of 3 paid', tone: 'held' });
    expect(instructionOutcome([{ status: 'not-approved' }])).toEqual({ label: 'Not approved', tone: 'refused' });
    expect(instructionOutcome([{ status: 'not-approved' }, { status: 'failed' }])).toEqual({ label: 'None paid', tone: 'refused' });
    expect(instructionOutcome([])).toEqual({ label: 'Nothing to pay', tone: 'neutral' });
    expect(instructionOutcome([{ status: 'paid' }, { status: 'in-progress' }]).label).toBe('In progress');
  });

  it("puts Thuso's reading in one line", () => {
    expect(readSummary([intent('Naledi Mokoena', '2', 'A')])).toBe('Found 1 payment: 2 RLUSD to Naledi Mokoena.');
    expect(readSummary(['A', 'B', 'C'].map((ref) => intent('Thabo Nkosi', '2', ref)))).toBe('Found 3 payments to Thabo Nkosi, 2 RLUSD each.');
    expect(readSummary([intent('Naledi Mokoena', '2', 'A'), intent('Thabo Nkosi', '1', 'B')])).toBe(
      'Found 2 payments: 2 RLUSD to Naledi Mokoena and 1 RLUSD to Thabo Nkosi.',
    );
    expect(readSummary([])).toBe('Found no payments.');
  });
});
