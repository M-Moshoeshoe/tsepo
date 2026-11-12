import { DESK_FILTERS, type DeskFilter } from '../../src/views/desk.ts';
import { deskHref } from '../../src/views/desk-href.ts';
import { FilterTabs } from '../filter-tabs.tsx';

/** The incoming payments filters, with a count on each. */
export function DeskTabs({ counts, filter, earlier }: { counts: Record<DeskFilter, number>; filter: DeskFilter; earlier: boolean }) {
  return (
    <FilterTabs
      label="Filter payments"
      current={filter}
      tabs={DESK_FILTERS.map((option) => ({ id: option.id, label: option.label, href: deskHref({ filter: option.id, earlier }), count: counts[option.id] }))}
    />
  );
}
