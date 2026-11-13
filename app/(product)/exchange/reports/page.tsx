import type { Metadata } from 'next';
import { Button } from '@/components/base/buttons/button';
import { SectionTitle } from '../../../../components/display.tsx';
import { defaultRange, parseReportRange, recordsInRange, REPORT_FIELDS, type ReportRange } from '../../../../src/views/reports.ts';
import { formatSastDate } from '../../../../src/views/status.ts';
import { loadDecisionRecords } from '../../../_data/reports.ts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Reports, Receiving exchange - Tšepo' };

function downloadHref(range: ReportRange, format: 'csv' | 'json'): string {
  return `/exchange/reports/download?${new URLSearchParams({ from: range.from, to: range.to, format }).toString()}`;
}

/** A SAST day as a readable date, such as "13 November 2026". */
function dayText(day: string): string {
  return formatSastDate(`${day}T12:00:00Z`);
}

const DATE_INPUT =
  'rounded-lg bg-primary px-3 py-2 text-md text-primary shadow-xs ring-1 ring-primary outline-hidden ring-inset focus:ring-2 focus:ring-brand';

/** Decision records for a date range, ready for the exchange's own goAML reporting. */
export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const first = (value: string | string[] | undefined): string | undefined => (Array.isArray(value) ? value[0] : value);
  const now = new Date();
  const parsed = parseReportRange(first(params.from), first(params.to), now);
  const range = 'error' in parsed ? defaultRange(now) : parsed;
  const count = recordsInRange(await loadDecisionRecords(), range).length;

  return (
    <div className="grid max-w-3xl gap-8">
      <p className="text-md text-secondary">
        Download every decision at your agent deposit address for a date range: who sent each payment, for which business, to whom,
        the Travel Rule reference and the outcome. Use it for your own goAML reporting. Tšepo files nothing with the FIC, and your
        compliance team stays responsible for every report.
      </p>

      <section aria-labelledby="range-title" className="grid gap-4 rounded-xl bg-secondary p-5 lg:p-6">
        <SectionTitle id="range-title" title="Choose the days" />
        <form method="get" className="flex flex-wrap items-end gap-4">
          <label className="grid gap-1.5 text-sm font-medium text-secondary">
            First day
            <input type="date" name="from" defaultValue={range.from} className={DATE_INPUT} required />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-secondary">
            Last day
            <input type="date" name="to" defaultValue={range.to} className={DATE_INPUT} required />
          </label>
          <Button type="submit" color="secondary" size="md">
            Show the count
          </Button>
        </form>
        {'error' in parsed && (
          <p role="alert" className="text-sm text-error-primary">
            {parsed.error} The last 30 days are shown instead.
          </p>
        )}
        <div className="grid gap-3 border-t border-secondary pt-4">
          <p className="text-sm text-secondary" role="status">
            {count === 0
              ? `No decisions from ${dayText(range.from)} to ${dayText(range.to)}.`
              : `${String(count)} ${count === 1 ? 'decision' : 'decisions'} from ${dayText(range.from)} to ${dayText(range.to)}.`}
          </p>
          <div className="flex flex-wrap gap-3">
            <Button href={downloadHref(range, 'csv')} color="primary" size="md">
              Download CSV
            </Button>
            <Button href={downloadHref(range, 'json')} color="secondary" size="md">
              Download JSON
            </Button>
          </div>
        </div>
      </section>

      <section aria-labelledby="fields-title" className="grid gap-3">
        <SectionTitle id="fields-title" title="What each record holds" />
        <ul className="grid list-disc gap-1.5 pl-5 text-sm text-secondary sm:grid-cols-2">
          {REPORT_FIELDS.map((field) => (
            <li key={field.key}>{field.header}</li>
          ))}
        </ul>
        <p className="text-sm text-tertiary">
          Times are in UTC, and days are counted in SAST. Personal data stays off the ledger: the Travel Rule reference is the
          fingerprint the payment carries, and the details behind it are the ones your exchange received before the payment.
        </p>
      </section>
    </div>
  );
}
