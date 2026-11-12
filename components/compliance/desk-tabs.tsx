import Link from 'next/link';
import { Badge } from '@/components/base/badges/badges';
import { cx } from '@/utils/cx';
import { DESK_FILTERS, type DeskFilter } from '../../src/views/desk.ts';
import { deskHref } from '../../app/compliance/desk-href.ts';

/**
 * Filter links styled as underline tabs, with a count on each. They are
 * links in a nav with aria-current, because each filter is its own address.
 */
export function DeskTabs({ counts, filter, earlier }: { counts: Record<DeskFilter, number>; filter: DeskFilter; earlier: boolean }) {
  return (
    <nav aria-label="Filter payments" className="min-w-0 overflow-x-auto border-b border-secondary">
      <ul className="flex gap-4">
        {DESK_FILTERS.map((option) => {
          const current = option.id === filter;
          return (
            <li key={option.id} className="shrink-0">
              <Link
                href={deskHref({ filter: option.id, earlier })}
                scroll={false}
                aria-current={current ? 'page' : undefined}
                className={cx(
                  '-mb-px flex items-center gap-1.5 border-b-2 px-0.5 pb-2.5 text-sm font-semibold whitespace-nowrap outline-focus-ring focus-visible:outline-2',
                  current
                    ? 'border-fg-brand-primary_alt text-brand-secondary'
                    : 'border-transparent text-quaternary hover:border-fg-brand-primary_alt hover:text-brand-secondary',
                )}
              >
                {option.label}
                <Badge type="pill-color" color={current ? 'brand' : 'gray'} size="sm">
                  <span className="tabular-nums">{counts[option.id]}</span>
                  <span className="sr-only">{counts[option.id] === 1 ? ' entry' : ' entries'}</span>
                </Badge>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
