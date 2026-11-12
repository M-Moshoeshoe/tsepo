import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckTimeline } from '../../components/compliance/check-timeline.tsx';
import { PackageDetails } from '../../components/compliance/package-details.tsx';
import { Amount, EmptyState, ExplorerLink, Facts, Mono, Section } from '../../components/display.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { cn } from '../../components/ui/cn.ts';
import { formatUtc, reasonText } from '../../src/views/status.ts';
import { loadDesk, type DeskDetail, type DeskEntry } from '../_data/compliance.ts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Compliance desk - Tšepo' };

const KIND_TEXT: Record<DeskEntry['kind'], string> = {
  deposit: 'Payment received',
  refusal: 'Refused before the ledger',
  rejection: 'Rejected by the ledger',
};

function shortAddress(address: string): string {
  return address.length > 14 ? `${address.slice(0, 6)}...${address.slice(-6)}` : address;
}

function EntryList({ entries, selectedId }: { entries: DeskEntry[]; selectedId: string | undefined }) {
  if (entries.length === 0) {
    return (
      <EmptyState title="No payments or refused attempts yet">Run a scenario from the demo controls to see one here.</EmptyState>
    );
  }
  return (
    <ul className="-mx-4 -my-4 divide-y divide-border">
      {entries.map((entry) => {
        const selected = entry.id === selectedId;
        return (
          <li key={entry.id}>
            <Link
              href={`/compliance?entry=${encodeURIComponent(entry.id)}#detail`}
              aria-current={selected ? 'true' : undefined}
              scroll={false}
              className={cn('grid gap-1.5 px-4 py-3 hover:bg-background', selected && 'bg-background')}
            >
              <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
                <span className="text-muted">{KIND_TEXT[entry.kind]}</span>
                <span className="text-muted tabular-nums">{formatUtc(entry.at)}</span>
              </span>
              <span className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-sm">
                <span className="font-mono text-[13px] text-ink" title={entry.sender}>
                  From {shortAddress(entry.sender)}
                </span>
                <Amount value={entry.amount} className="font-medium text-ink" />
              </span>
              <span>
                <Badge tone={entry.status.tone} className="whitespace-normal">
                  {entry.status.label}
                </Badge>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function Detail({ detail }: { detail: DeskDetail | undefined }) {
  if (detail === undefined) {
    return <EmptyState title="Nothing selected">Select a payment or an attempt to see its checks.</EmptyState>;
  }
  const { entry } = detail;
  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <Badge tone={entry.status.tone} className="w-fit text-sm whitespace-normal">
          {entry.status.label}
        </Badge>
        <Facts
          items={[
            { term: 'Time', value: formatUtc(entry.at) },
            { term: 'Sender', value: <Mono>{entry.sender}</Mono> },
            { term: 'Amount', value: <Amount value={entry.amount} /> },
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
        {/* The key restarts the timeline when another entry is selected. */}
        <CheckTimeline key={entry.id} checks={detail.checks} />
      </div>
      <PackageDetails pkg={detail.pkg} />
    </div>
  );
}

export default async function CompliancePage({ searchParams }: { searchParams: Promise<{ entry?: string | string[] }> }) {
  const { entry } = await searchParams;
  const view = await loadDesk(typeof entry === 'string' ? entry : undefined);
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm text-muted">Compliance desk</p>
        <h1 className="text-2xl font-semibold text-ink">Demo Exchange, agent lane</h1>
        <p className="mt-1 text-sm text-muted">
          Accepts deposits only from agents with a valid credential. Account <Mono className="text-xs text-muted">{view.laneAddress}</Mono>
        </p>
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <Section title="Payments and refused attempts">
          <EntryList entries={view.entries} selectedId={view.detail?.entry.id} />
        </Section>
        <Section title="Details" id="detail">
          <Detail detail={view.detail} />
        </Section>
      </div>
    </div>
  );
}
