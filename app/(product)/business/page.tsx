import type { Metadata } from 'next';
import { Button } from '@/components/base/buttons/button';
import { AgentStatusBadge } from '../../../components/business/agent-status.tsx';
import { PaymentList } from '../../../components/business/payment-list.tsx';
import { PaymentPanel } from '../../../components/business/payment-panel.tsx';
import { TodayMeter } from '../../../components/business/today-meter.tsx';
import { ColumnChart } from '../../../components/charts/column-chart.tsx';
import { SectionTitle } from '../../../components/display.tsx';
import { EmptyMessage } from '../../../components/empty-message.tsx';
import { dayLabels } from '../../../src/views/date-range.ts';
import { findPayment, parsePaymentQuery, paymentsHref, spendByDay } from '../../../src/views/payments.ts';
import { storyTitle } from '../../../src/views/scenarios.ts';
import { loadRegistry, type RegistryView } from '../../_data/registry.ts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Overview, Lesedi Design Studio - Tšepo' };

const PATH = '/business';

function AgentCard({ view }: { view: RegistryView }) {
  const { agent, mandate } = view;
  return (
    <section aria-labelledby="agent-card-title" className="grid content-start gap-5 rounded-xl bg-secondary p-5 lg:p-6">
      <div className="grid gap-1.5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 id="agent-card-title" className="text-lg font-semibold text-primary">
            {agent.name}
          </h2>
          <AgentStatusBadge status={agent.status} />
        </div>
        <p className="text-sm text-tertiary">Pays contractors for {view.business.registeredName}.</p>
      </div>
      {mandate === undefined || agent.status.state !== 'active' ? (
        <p className="text-sm text-secondary">
          {agent.status.state === 'revoked'
            ? 'This agent is revoked. Its credential is deleted, so it cannot pay. You can register it again from the Agent page.'
            : 'This agent has no valid spending rules, so it cannot pay.'}
        </p>
      ) : (
        <TodayMeter usage={mandate.usage} perPaymentLimit={mandate.perPaymentLimit} totalsClearedAt={mandate.totalsClearedAt} />
      )}
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        <Button href="/business/agent" color="link-color" size="md">
          Agent details
        </Button>
        <Button href="/business/rules" color="link-color" size="md">
          Spending rules
        </Button>
      </div>
    </section>
  );
}

/** The Business Overview: what the agent may spend today, and its latest payments. */
export default async function OverviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parsePaymentQuery(await searchParams);
  const view = await loadRegistry();
  const recent = view.payments.slice(0, 5);
  const open = findPayment(view.instructions, query.payment);
  const spending = spendByDay(view.payments, new Date());
  const overLimit = view.mandate !== undefined && spending.some((day) => Number(day.paid) > Number(view.mandate?.dailyLimit));

  return (
    <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <AgentCard view={view} />
      <section aria-labelledby="recent-title" className="grid min-w-0 gap-4">
        <SectionTitle
          id="recent-title"
          title="Recent payments"
          aside={
            recent.length > 0 && (
              <Button href="/business/payments" color="link-color" size="md">
                All payments
              </Button>
            )
          }
        />
        {recent.length === 0 ? (
          <EmptyMessage title="No payments yet.">{`Your agent's payments appear here. Run "${storyTitle('scenario-2')}" in the guided tour to see one.`}</EmptyMessage>
        ) : (
          <PaymentList label="Recent payments" items={recent.map((payment) => ({ payment, href: paymentsHref(PATH, { payment: payment.id }) }))} />
        )}
      </section>
      {view.mandate !== undefined && (
        <section aria-label="Spending, last 14 days" className="rounded-xl p-4 ring-1 ring-secondary ring-inset lg:p-5 xl:col-span-2">
          <ColumnChart
            id="spending"
            title="Spending, last 14 days"
            description={`RLUSD the agent paid each day over the last 14 days, against today's daily limit of ${view.mandate.dailyLimit} RLUSD.`}
            series={[{ key: 'paid', label: 'Paid', fill: 'fill-utility-brand-400', swatch: 'bg-utility-brand-400' }]}
            columns={spending.map((day) => {
              const labels = dayLabels(day.day);
              return { key: day.day, label: labels.short, full: labels.full, values: [Number(day.paid)] };
            })}
            unit="RLUSD"
            limit={{ value: Number(view.mandate.dailyLimit), label: `Daily limit ${view.mandate.dailyLimit} RLUSD` }}
            note={
              overLimit
                ? "Only paid payments count. The sample workspace starts each guided tour story from a fresh daily total, so a sample day can add up to more than the limit. No single total ever passed it."
                : "Only paid payments count. The line shows today's daily limit."
            }
          />
        </section>
      )}
      {open !== undefined && <PaymentPanel open={open} closeHref={PATH} />}
    </div>
  );
}
