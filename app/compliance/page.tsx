import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckTimeline } from '../../components/compliance/check-timeline.tsx';
import { DeskTable } from '../../components/compliance/desk-table.tsx';
import { DetailSheet } from '../../components/compliance/detail-sheet.tsx';
import { PackageDetails } from '../../components/compliance/package-details.tsx';
import { Amount, CopyableMono, EmptyState, ExplorerLink, Facts, Mono, Section } from '../../components/display.tsx';
import { Term } from '../../components/term.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { cn } from '../../components/ui/cn.ts';
import { DESK_FILTERS, emptyDeskText, parseDeskFilter, type DeskFilter } from '../../src/views/desk.ts';
import { isGlossaryTerm } from '../../src/views/glossary.ts';
import { formatSast, reasonText } from '../../src/views/status.ts';
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
            { term: 'Sender', value: <CopyableMono value={entry.sender} label="sender account" /> },
            { term: 'Amount', value: <Amount value={entry.amount} asset={entry.asset ?? 'RLUSD'} /> },
            ...(entry.ledgerResult === undefined ? [] : [{ term: 'Ledger result', value: <LedgerResult code={entry.ledgerResult} /> }]),
            ...(entry.hash === undefined
              ? [{ term: 'Ledger', value: <span className="text-muted">Never submitted. The policy service refused to co-sign.</span> }]
              : [
                  {
                    term: 'Transaction',
                    value: (
                      <span className="grid gap-1">
                        <CopyableMono value={entry.hash} label="transaction hash" className="text-xs" />
                        <ExplorerLink hash={entry.hash} />
                      </span>
                    ),
                  },
                ]),
            ...(entry.invoiceId === undefined
              ? []
              : [
                  {
                    key: 'package-fingerprint',
                    term: (
                      <>
                        Package <Term term="fingerprint">fingerprint</Term>
                      </>
                    ),
                    value: <CopyableMono value={entry.invoiceId} label="package fingerprint" className="text-xs" />,
                  },
                ]),
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

/** A ledger result code, explained in plain words when it is jargon. */
function LedgerResult({ code }: { code: string }) {
  return <Mono>{isGlossaryTerm(code) ? <Term term={code}>{code}</Term> : code}</Mono>;
}

function EmptyDesk({ filter }: { filter: DeskFilter }) {
  const text = emptyDeskText(filter);
  return <EmptyState title={text.title}>{text.next}</EmptyState>;
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
          This <Term term="agent-lane">agent lane</Term> accepts deposits only from agents with a valid credential. Account{' '}
          <CopyableMono value={view.laneAddress} label="agent lane account" className="text-xs text-muted" />
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
              <EmptyDesk filter={filter} />
            </div>
          ) : (
            <DeskTable groups={view.groups} selectedId={view.detail?.entry.id} hrefFor={hrefFor} />
          )}
        </Section>
        <Section title="Details" className="hidden lg:block">
          {view.detail === undefined ? (
            <EmptyState title="Nothing selected yet.">Choose a payment or an attempt in the list to see its checks.</EmptyState>
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
