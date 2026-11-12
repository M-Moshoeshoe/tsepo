import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckTimeline } from '../../components/compliance/check-timeline.tsx';
import { DeskTable } from '../../components/compliance/desk-table.tsx';
import { DetailSheet } from '../../components/compliance/detail-sheet.tsx';
import { PackageDetails } from '../../components/compliance/package-details.tsx';
import { Amount, EmptyState, ExplorerLink, Facts, Mono, Section } from '../../components/display.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { cn } from '../../components/ui/cn.ts';
import { DESK_FILTERS, parseDeskFilter, type DeskFilter } from '../../src/views/desk.ts';
import { CATEGORY_CHIPS, formatSast, reasonText } from '../../src/views/status.ts';
import { loadDesk, type DeskDetail, type DeskView } from '../_data/compliance.ts';
import { deskHref } from './desk-href.ts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Compliance desk - Tšepo' };

function Detail({ detail }: { detail: DeskDetail }) {
  const { entry } = detail;
  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <Badge tone={entry.status.tone} className="w-fit text-sm whitespace-normal">
          {entry.status.label}
        </Badge>
        <Facts
          items={[
            { term: 'Time', value: formatSast(entry.at) },
            { term: 'Sender', value: <Mono>{entry.sender}</Mono> },
            { term: 'Amount', value: <Amount value={entry.amount} asset={entry.asset ?? 'RLUSD'} /> },
            ...(entry.ledgerResult === undefined ? [] : [{ term: 'Ledger result', value: <Mono>{entry.ledgerResult}</Mono> }]),
            ...(entry.hash === undefined
              ? [{ term: 'Ledger', value: <span className="text-muted">Never submitted. The policy service refused to co-sign.</span> }]
              : [{ term: 'Transaction', value: <ExplorerLink hash={entry.hash} /> }]),
            ...(entry.invoiceId === undefined ? [] : [{ term: 'Package reference', value: <Mono className="text-xs">{entry.invoiceId}</Mono> }]),
            ...(entry.reasons.length === 0 || entry.kind === 'rejection'
              ? []
              : [{ term: 'Reasons', value: entry.reasons.map(reasonText).join('; ') }]),
          ]}
        />
      </div>
      <div className="grid gap-3">
        <h3 className="text-sm font-semibold text-ink">Checks</h3>
        {/* The key restarts the timeline when another entry is chosen. */}
        <CheckTimeline key={entry.id} checks={detail.checks} />
      </div>
      <PackageDetails pkg={detail.pkg} />
    </div>
  );
}

function FilterTabs({ view, filter, earlier }: { view: DeskView; filter: DeskFilter; earlier: boolean }) {
  return (
    <nav aria-label="Filter payments" className="border-b border-border px-4 py-2">
      <ul className="flex flex-wrap gap-1">
        {DESK_FILTERS.map((option) => {
          const current = option.id === filter;
          return (
            <li key={option.id}>
              <Link
                href={deskHref({ filter: option.id, earlier })}
                scroll={false}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-medium',
                  current ? 'bg-background text-primary' : 'text-muted hover:text-ink',
                )}
              >
                {option.label}
                <span className="tabular-nums text-xs text-muted">{view.counts[option.id]}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function EarlierToggle({ view, filter, earlier }: { view: DeskView; filter: DeskFilter; earlier: boolean }) {
  if (view.lastResetAt === undefined) return null;
  return (
    <Link href={deskHref({ filter, earlier: !earlier })} scroll={false} className="rounded-md text-sm font-medium text-primary hover:underline">
      {earlier ? 'Show only runs since the last reset' : `Show earlier runs (${view.earlierCount})`}
    </Link>
  );
}

function emptyMessage(filter: DeskFilter, earlier: boolean): string {
  const scope = earlier ? '' : ' since the last reset';
  return filter === 'all' ? `Nothing has happened on the agent lane${scope}.` : `Nothing to show as ${CATEGORY_CHIPS[filter]}${scope}.`;
}

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ entry?: string | string[]; filter?: string | string[]; earlier?: string | string[] }>;
}) {
  const params = await searchParams;
  const filter = parseDeskFilter(typeof params.filter === 'string' ? params.filter : undefined);
  const earlier = params.earlier === '1';
  const view = await loadDesk({ entryId: typeof params.entry === 'string' ? params.entry : undefined, filter, earlier });
  const hrefFor = (entry: string): string => deskHref({ filter, earlier, entry });

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink">Demo Exchange, agent lane</h1>
        <p className="mt-1 text-sm text-muted">
          Accepts deposits only from agents with a valid credential. Account <Mono className="text-xs text-muted">{view.laneAddress}</Mono>
        </p>
        <p className="mt-1 text-sm text-muted">
          {view.lastResetAt === undefined
            ? 'All times are in SAST.'
            : `${earlier ? 'Showing every run' : 'Showing runs since the last reset'}, at ${formatSast(view.lastResetAt)}. All times are in SAST.`}
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)]">
        <Section title="Payments and refused attempts" aside={<EarlierToggle view={view} filter={filter} earlier={earlier} />} flush>
          <FilterTabs view={view} filter={filter} earlier={earlier} />
          {view.groups.length === 0 ? (
            <div className="p-4">
              <EmptyState title={emptyMessage(filter, earlier)}>Run a scenario from the demo controls to see it here.</EmptyState>
            </div>
          ) : (
            <DeskTable groups={view.groups} selectedId={view.detail?.entry.id} hrefFor={hrefFor} />
          )}
        </Section>
        <Section title="Details" className="hidden lg:block">
          {view.detail === undefined ? (
            <EmptyState title="Nothing selected">Choose a payment or an attempt to see its checks.</EmptyState>
          ) : (
            <Detail detail={view.detail} />
          )}
        </Section>
      </div>
      {view.detail !== undefined && (
        <DetailSheet open={view.explicitlySelected} closeHref={deskHref({ filter, earlier })} title="Details">
          <Detail detail={view.detail} />
        </DetailSheet>
      )}
    </div>
  );
}
