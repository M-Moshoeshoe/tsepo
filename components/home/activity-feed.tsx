import Link from 'next/link';
import type { DeskEntry } from '../../app/_data/desk-entries.ts';
import { deskHref } from '../../app/compliance/desk-href.ts';
import { actorName } from '../../src/views/actors.ts';
import { formatSast } from '../../src/views/status.ts';
import { Amount, StatusBadge } from '../display.tsx';
import { EmptyMessage } from '../empty-message.tsx';

/** The five newest payments and stopped attempts, each linking to its details on the compliance desk. */
export function ActivityFeed({ entries }: { entries: DeskEntry[] }) {
  if (entries.length === 0) {
    return <EmptyMessage title="No activity yet.">Run scenario 2 to see a cleared payment.</EmptyMessage>;
  }
  return (
    <ol className="grid">
      {entries.map((entry) => (
        <li key={entry.id} className="border-t border-secondary first:border-t-0">
          <Link
            href={deskHref({ filter: 'all', earlier: true, entry: entry.id })}
            className="grid gap-1 rounded-md px-1 py-3 outline-focus-ring hover:bg-secondary focus-visible:outline-2"
          >
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-primary">
                <Amount value={entry.amount} asset={entry.asset ?? 'RLUSD'} className="font-semibold" /> from {entry.senderName}
              </span>
              <StatusBadge tone={entry.status.tone}>{entry.status.chip}</StatusBadge>
            </span>
            <span className="text-xs text-tertiary tabular-nums">
              {formatSast(entry.at)}. Decided by {actorName(entry.decidedBy)}.
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
