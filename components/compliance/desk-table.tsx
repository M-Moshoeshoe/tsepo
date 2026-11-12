import Link from 'next/link';
import { formatSastTime } from '../../src/views/status.ts';
import type { DeskEntry } from '../../app/_data/compliance.ts';
import { Amount } from '../display.tsx';
import { Badge } from '../ui/badge.tsx';
import { cn } from '../ui/cn.ts';

function ShortAddress({ address }: { address: string }) {
  return (
    <span className="font-mono text-[13px] text-ink" title={address}>
      <span className="sm:hidden">
        {address.slice(0, 4)}...{address.slice(-4)}
      </span>
      <span className="hidden sm:inline">
        {address.slice(0, 6)}...{address.slice(-6)}
      </span>
    </span>
  );
}

/**
 * A compact table of payments and refused attempts, grouped under their SAST
 * date. The time cell holds the link; it stretches over the whole row, so the
 * row is one click target and one tab stop.
 */
export function DeskTable({
  groups,
  selectedId,
  hrefFor,
}: {
  groups: { date: string; items: DeskEntry[] }[];
  selectedId: string | undefined;
  hrefFor: (entryId: string) => string;
}) {
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">Payments into the agent lane and attempts refused before they reached it, newest first</caption>
      <thead>
        <tr className="border-b border-border text-left text-xs text-muted">
          <th scope="col" className="py-2 pr-3 pl-4 font-medium">
            Time
          </th>
          <th scope="col" className="py-2 pr-3 font-medium">
            Sender
          </th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">
            Amount
          </th>
          <th scope="col" className="py-2 pr-4 font-medium">
            Status
          </th>
        </tr>
      </thead>
      {groups.map((group) => (
        <tbody key={group.date}>
          <tr>
            <th scope="colgroup" colSpan={4} className="bg-background px-4 py-1.5 text-left text-xs font-medium text-muted">
              {group.date}
            </th>
          </tr>
          {group.items.map((entry) => {
            const selected = entry.id === selectedId;
            return (
              <tr key={entry.id} className={cn('relative border-t border-border hover:bg-background', selected && 'bg-background')}>
                <td className="py-2.5 pr-3 pl-4 whitespace-nowrap">
                  <Link
                    href={hrefFor(entry.id)}
                    scroll={false}
                    aria-current={selected ? 'true' : undefined}
                    className="tabular-nums text-ink after:absolute after:inset-0 after:content-['']"
                  >
                    {formatSastTime(entry.at)}
                    <span className="sr-only">, {entry.status.chip}</span>
                  </Link>
                </td>
                <td className="py-2.5 pr-3">
                  <ShortAddress address={entry.sender} />
                </td>
                <td className="py-2.5 pr-3 text-right whitespace-nowrap">
                  <Amount value={entry.amount} asset={entry.asset ?? 'RLUSD'} className="font-medium text-ink" />
                </td>
                <td className="py-2.5 pr-4">
                  <Badge tone={entry.status.tone} className="whitespace-normal">
                    {entry.status.chip}
                  </Badge>
                </td>
              </tr>
            );
          })}
        </tbody>
      ))}
    </table>
  );
}
