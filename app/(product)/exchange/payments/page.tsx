import type { Metadata } from 'next';
import { ColumnChart, type ChartSeries } from '../../../../components/charts/column-chart.tsx';
import { DeskTable } from '../../../../components/compliance/desk-table.tsx';
import { DeskTabs } from '../../../../components/compliance/desk-tabs.tsx';
import { PaymentDetails, PaymentHeader } from '../../../../components/compliance/payment-details.tsx';
import { DetailsPanel } from '../../../../components/details-panel.tsx';
import { CopyableMono, ExplorerLink, SampleDataTag } from '../../../../components/display.tsx';
import { EmptyMessage } from '../../../../components/empty-message.tsx';
import { SegmentedLinks } from '../../../../components/filter-tabs.tsx';
import { Term } from '../../../../components/term.tsx';
import { DATE_PRESETS, dayLabels, MAX_CHART_DAYS, parseRange } from '../../../../src/views/date-range.ts';
import { emptyDeskText, OUTCOMES, parseDeskFilter } from '../../../../src/views/desk.ts';
import { deskHref } from '../../../../src/views/desk-href.ts';
import { CATEGORY_CHIPS, type Category } from '../../../../src/views/status.ts';
import { loadDesk } from '../../../_data/compliance.ts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Incoming payments, Sample Exchange - Tšepo' };

/** Theme status colours in a fixed order, validated for colour-blind separation on the white surface. */
const OUTCOME_COLOURS: Record<Category, Pick<ChartSeries, 'fill' | 'swatch'>> = {
  cleared: { fill: 'fill-utility-green-600', swatch: 'bg-utility-green-600' },
  held: { fill: 'fill-utility-yellow-400', swatch: 'bg-utility-yellow-400' },
  refused: { fill: 'fill-utility-blue-600', swatch: 'bg-utility-blue-600' },
  rejected: { fill: 'fill-utility-red-500', swatch: 'bg-utility-red-500' },
};

const SERIES: ChartSeries[] = OUTCOMES.map((outcome) => ({ key: outcome, label: CATEGORY_CHIPS[outcome], ...OUTCOME_COLOURS[outcome] }));

/** The exchange's queue of agent payments: outcomes over time, filters, and every payment's details. */
export default async function IncomingPaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const one = (key: string): string | undefined => (typeof params[key] === 'string' ? params[key] : undefined);
  const filter = parseDeskFilter(one('filter'));
  const range = parseRange(one('range'));
  const view = await loadDesk({ entryId: one('entry'), filter, range });
  const empty = view.total === 0 ? emptyDeskText(filter) : { title: 'No payments match these filters.', next: 'Choose another outcome or a longer date range.' };
  const truncated = range === 'all' && view.outcomes.days.length === MAX_CHART_DAYS;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="grid gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-primary">Sample Exchange</h2>
          <SampleDataTag />
        </div>
        <p className="text-sm text-tertiary">
          The XRP Ledger accepts payments to this <Term term="agent-deposit-address">agent deposit address</Term> only from agents
          with a valid Tšepo credential.
        </p>
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-tertiary">
          Address <CopyableMono value={view.laneAddress} label="agent deposit address" className="text-tertiary" />
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-tertiary">All times are in SAST.</p>
        <SegmentedLinks
          label="Date range"
          current={range}
          options={DATE_PRESETS.map((preset) => ({ id: preset.id, label: preset.label, href: deskHref({ filter, range: preset.id }) }))}
        />
      </div>

      {view.counts.all > 0 && (
        <div className="rounded-xl p-4 ring-1 ring-secondary ring-inset lg:p-5">
          <ColumnChart
            id="outcomes"
            title="Outcomes by day"
            description="Agent payments to the deposit address each day, stacked by outcome: accepted, held for review, announced but not sent, and rejected by the ledger."
            series={SERIES}
            columns={view.outcomes.days.map((day) => {
              const labels = dayLabels(day.day);
              return { key: day.day, label: labels.short, full: labels.full, values: OUTCOMES.map((outcome) => day.counts[outcome]) };
            })}
            unit=""
            totals={OUTCOMES.map((outcome) => view.outcomes.totals[outcome])}
            note={truncated ? `The chart shows the last ${String(MAX_CHART_DAYS)} days; the totals and the list cover all time.` : undefined}
          />
        </div>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
        <DeskTabs counts={view.counts} filter={filter} range={range} />

        {view.entries.length === 0 ? (
          <EmptyMessage title={empty.title}>{empty.next}</EmptyMessage>
        ) : (
          <div className="overflow-hidden rounded-xl bg-primary ring-1 ring-secondary">
            <DeskTable entries={view.entries} filter={filter} range={range} />
          </div>
        )}
      </div>

      {view.detail !== undefined && (
        <DetailsPanel
          label="Payment details"
          key={view.detail.entry.id}
          closeHref={deskHref({ filter, range })}
          header={<PaymentHeader detail={view.detail} />}
          footer={view.detail.entry.hash === undefined ? undefined : <ExplorerLink hash={view.detail.entry.hash}>View on the XRP Ledger</ExplorerLink>}
        >
          <PaymentDetails detail={view.detail} />
        </DetailsPanel>
      )}
    </div>
  );
}
