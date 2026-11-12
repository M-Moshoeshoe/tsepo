import type { Metadata } from 'next';
import { PaymentPanel } from '../../../../components/business/payment-panel.tsx';
import { PaymentsTable } from '../../../../components/business/payments-table.tsx';
import { EmptyMessage } from '../../../../components/empty-message.tsx';
import { FilterTabs, SegmentedLinks } from '../../../../components/filter-tabs.tsx';
import { DATE_PRESETS } from '../../../../src/views/date-range.ts';
import { parsePaymentQuery, paymentsHref, STATUS_FILTERS } from '../../../../src/views/payments.ts';
import { storyTitle } from '../../../../src/views/scenarios.ts';
import { loadPayments } from '../../../_data/business.ts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Payments, Lesedi Design Studio - Tšepo' };

const PATH = '/business/payments';

/** Every payment the agent made or tried to make, with filters, details and evidence. */
export default async function PaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parsePaymentQuery(await searchParams);
  const view = await loadPayments(query);
  const filters = { status: query.status, range: query.range };
  const nothingAtAll = view.total === 0;
  const shownCount = view.shown.length;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-tertiary">Every payment your agent made or tried to make. All times are in SAST.</p>
        <SegmentedLinks
          label="Date range"
          current={query.range}
          options={DATE_PRESETS.map((preset) => ({ id: preset.id, label: preset.label, href: paymentsHref(PATH, { ...filters, range: preset.id }) }))}
        />
      </div>

      <FilterTabs
        label="Filter payments by status"
        current={query.status}
        tabs={STATUS_FILTERS.map((filter) => ({
          id: filter.id,
          label: filter.label,
          href: paymentsHref(PATH, { ...filters, status: filter.id }),
          count: view.counts[filter.id],
        }))}
      />

      {shownCount === 0 ? (
        nothingAtAll ? (
          <EmptyMessage title="No payments yet.">{`Your agent's payments appear here as they happen. Run "${storyTitle('scenario-2')}" in the guided tour to see one.`}</EmptyMessage>
        ) : (
          <EmptyMessage title="No payments match these filters.">Choose another status or a longer date range.</EmptyMessage>
        )
      ) : (
        <>
          <div className="overflow-hidden rounded-xl bg-primary ring-1 ring-secondary">
            <PaymentsTable rows={view.shown.map((payment) => ({ payment, href: paymentsHref(PATH, { ...filters, payment: payment.id }) }))} />
          </div>
          <p className="text-sm text-tertiary tabular-nums">
            {shownCount === 1 ? '1 payment' : `${String(shownCount)} payments`}, {view.paidTotal} RLUSD paid.
          </p>
        </>
      )}

      {view.open !== undefined && <PaymentPanel open={view.open} closeHref={paymentsHref(PATH, filters)} />}
    </div>
  );
}
