import type { Metadata } from 'next';
import Link from 'next/link';
import { DeskTable } from '../../components/compliance/desk-table.tsx';
import { DeskTabs } from '../../components/compliance/desk-tabs.tsx';
import { PaymentDetails, PaymentHeader } from '../../components/compliance/payment-details.tsx';
import { PaymentSlideout } from '../../components/compliance/payment-slideout.tsx';
import { CopyableMono, EmptyMessage, ExplorerLink } from '../../components/display.tsx';
import { Term } from '../../components/term.tsx';
import { emptyDeskText, parseDeskFilter } from '../../src/views/desk.ts';
import { formatSast } from '../../src/views/status.ts';
import { loadDesk } from '../_data/compliance.ts';
import { deskHref } from './desk-href.ts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Compliance desk - Tšepo' };

export default async function CompliancePage({
  searchParams,
}: {
  searchParams: Promise<{ entry?: string | string[]; filter?: string | string[]; earlier?: string | string[] }>;
}) {
  const params = await searchParams;
  const filter = parseDeskFilter(typeof params.filter === 'string' ? params.filter : undefined);
  const earlier = params.earlier === '1';
  const view = await loadDesk({ entryId: typeof params.entry === 'string' ? params.entry : undefined, filter, earlier });
  const empty = emptyDeskText(filter);

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6">
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold text-primary">Demo Exchange, agent lane</h2>
        <p className="text-sm text-tertiary">
          This <Term term="agent-lane">agent lane</Term> accepts deposits only from agents with a valid credential.
        </p>
        <p className="flex flex-wrap items-center gap-x-2 text-sm text-tertiary">
          Account <CopyableMono value={view.laneAddress} label="agent lane account" className="text-tertiary" />
        </p>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-4">
        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <p className="text-sm text-tertiary">
            {view.lastResetAt === undefined
              ? 'All times are in SAST.'
              : `${earlier ? 'Showing every run' : 'Showing runs since the last reset'}, at ${formatSast(view.lastResetAt)}. All times are in SAST.`}
          </p>
          {view.lastResetAt !== undefined && (
            <Link
              href={deskHref({ filter, earlier: !earlier })}
              scroll={false}
              className="rounded-sm text-sm font-semibold text-brand-secondary outline-focus-ring hover:text-brand-secondary_hover focus-visible:outline-2"
            >
              {earlier ? 'Show only runs since the last reset' : `Show earlier runs (${String(view.earlierCount)})`}
            </Link>
          )}
        </div>

        <DeskTabs counts={view.counts} filter={filter} earlier={earlier} />

        {view.entries.length === 0 ? (
          <EmptyMessage title={empty.title}>{empty.next}</EmptyMessage>
        ) : (
          <div className="overflow-hidden rounded-xl bg-primary ring-1 ring-secondary">
            <DeskTable entries={view.entries} filter={filter} earlier={earlier} />
          </div>
        )}
      </div>

      {view.detail !== undefined && (
        <PaymentSlideout
          key={view.detail.entry.id}
          closeHref={deskHref({ filter, earlier })}
          header={<PaymentHeader detail={view.detail} />}
          footer={view.detail.entry.hash === undefined ? undefined : <ExplorerLink hash={view.detail.entry.hash} />}
        >
          <PaymentDetails detail={view.detail} />
        </PaymentSlideout>
      )}
    </div>
  );
}
