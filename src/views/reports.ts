import { z } from 'zod';
import { sastDay } from '../domain/time.ts';

/**
 * One decision at the agent deposit address, with the fields an exchange
 * needs for its own goAML reporting. Tšepo prepares the records; it files
 * nothing with the FIC.
 */
export interface DecisionRecord {
  /** When the ledger closed the payment, or when the attempt was stopped, in UTC. */
  time: string;
  transactionHash: string;
  sender: string;
  originatorBusiness: string;
  originatorRegistration: string;
  beneficiary: string;
  amount: string;
  asset: string;
  /** The fingerprint of the Travel Rule details, which the payment carries as its InvoiceID. */
  travelRuleReference: string;
  outcome: string;
  reasons: string;
}

/** The columns, in order, with the header each file uses. */
export const REPORT_FIELDS: readonly { key: keyof DecisionRecord; header: string }[] = [
  { key: 'time', header: 'Time (UTC)' },
  { key: 'transactionHash', header: 'Transaction hash' },
  { key: 'sender', header: 'Sender account' },
  { key: 'originatorBusiness', header: 'Originator business' },
  { key: 'originatorRegistration', header: 'Originator CIPC number' },
  { key: 'beneficiary', header: 'Beneficiary' },
  { key: 'amount', header: 'Amount' },
  { key: 'asset', header: 'Asset' },
  { key: 'travelRuleReference', header: 'Travel Rule reference' },
  { key: 'outcome', header: 'Outcome' },
  { key: 'reasons', header: 'Reasons' },
];

/** The longest range one file covers, so a download stays small. */
export const MAX_REPORT_DAYS = 366;

const DaySchema = z.iso.date();

export interface ReportRange {
  /** The first day, in SAST, as YYYY-MM-DD. */
  from: string;
  /** The last day, in SAST, inclusive. */
  to: string;
}

/** The last 30 days, ending today in SAST. */
export function defaultRange(now: Date): ReportRange {
  return { from: sastDay(new Date(now.getTime() - 29 * 86_400_000)), to: sastDay(now) };
}

/** Reads a range from the address. Missing days fall back to the last 30 days; a bad range returns one plain sentence. */
export function parseReportRange(from: unknown, to: unknown, now: Date): ReportRange | { error: string } {
  const fallback = defaultRange(now);
  const start = from === undefined || from === '' ? fallback.from : DaySchema.safeParse(from).data;
  const end = to === undefined || to === '' ? fallback.to : DaySchema.safeParse(to).data;
  if (start === undefined || end === undefined) return { error: 'Choose the days as dates, such as 2026-11-01.' };
  if (start > end) return { error: 'The first day must come before the last day.' };
  const days = (Date.parse(end) - Date.parse(start)) / 86_400_000 + 1;
  if (days > MAX_REPORT_DAYS) return { error: `Choose at most ${String(MAX_REPORT_DAYS)} days at a time.` };
  return { from: start, to: end };
}

/** The records whose time falls on a day in the range, in SAST, oldest first. */
export function recordsInRange(records: readonly DecisionRecord[], range: ReportRange): DecisionRecord[] {
  return records
    .filter((record) => {
      const day = sastDay(new Date(record.time));
      return day >= range.from && day <= range.to;
    })
    .sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * One CSV cell. Quoted when it holds a comma, quote or line break. A cell
 * that a spreadsheet would read as a formula is prefixed with an apostrophe,
 * so text from outside can never run as one.
 */
function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(safe) ? `"${safe.replaceAll('"', '""')}"` : safe;
}

/** The records as CSV, with a header row and Windows line endings, as spreadsheets expect. */
export function toCsv(records: readonly DecisionRecord[]): string {
  const rows = [REPORT_FIELDS.map((field) => field.header), ...records.map((record) => REPORT_FIELDS.map((field) => record[field.key]))];
  return `${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}\r\n`;
}

/** "tsepo-decisions-2026-11-01-to-2026-11-13.csv" */
export function reportFileName(range: ReportRange, format: 'csv' | 'json'): string {
  return `tsepo-decisions-${range.from}-to-${range.to}.${format}`;
}
