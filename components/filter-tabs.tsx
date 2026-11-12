import Link from 'next/link';
import { Badge } from '@/components/base/badges/badges';
import { cx } from '@/utils/cx';

export interface FilterTab {
  id: string;
  label: string;
  href: string;
  count: number;
}

/**
 * Filter links styled as Untitled UI underline tabs, with a count on each.
 * They are links in a nav with aria-current, because each filter is its own address.
 */
export function FilterTabs({ label, tabs, current }: { label: string; tabs: FilterTab[]; current: string }) {
  return (
    <nav aria-label={label} className="min-w-0 overflow-x-auto border-b border-secondary">
      <ul className="flex gap-4">
        {tabs.map((tab) => {
          const selected = tab.id === current;
          return (
            <li key={tab.id} className="shrink-0">
              <Link
                href={tab.href}
                scroll={false}
                aria-current={selected ? 'page' : undefined}
                className={cx(
                  '-mb-px flex items-center gap-1.5 border-b-2 px-0.5 pb-2.5 text-sm font-semibold whitespace-nowrap outline-focus-ring focus-visible:outline-2',
                  selected
                    ? 'border-fg-brand-primary_alt text-brand-secondary'
                    : 'border-transparent text-quaternary hover:border-fg-brand-primary_alt hover:text-brand-secondary',
                )}
              >
                {tab.label}
                <Badge type="pill-color" color={selected ? 'brand' : 'gray'} size="sm">
                  <span className="tabular-nums">{tab.count}</span>
                  <span className="sr-only">{tab.count === 1 ? ' entry' : ' entries'}</span>
                </Badge>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** A row of linked choices in the style of an Untitled UI button group, such as date presets. */
export function SegmentedLinks({ label, options, current }: { label: string; options: { id: string; label: string; href: string }[]; current: string }) {
  return (
    <nav aria-label={label}>
      <ul className="inline-flex overflow-hidden rounded-lg shadow-xs ring-1 ring-primary ring-inset">
        {options.map((option) => {
          const selected = option.id === current;
          return (
            <li key={option.id} className="border-l border-primary first:border-l-0">
              <Link
                href={option.href}
                scroll={false}
                aria-current={selected ? 'page' : undefined}
                className={cx(
                  'flex h-9 items-center px-3.5 text-sm font-semibold whitespace-nowrap outline-focus-ring focus-visible:outline-2 focus-visible:-outline-offset-2',
                  selected ? 'bg-active text-primary' : 'bg-primary text-secondary hover:bg-primary_hover',
                )}
              >
                {option.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
