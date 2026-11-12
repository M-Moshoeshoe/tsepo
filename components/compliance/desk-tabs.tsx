import type { DatePreset } from '../../src/views/date-range.ts';
import { DESK_FILTERS, type DeskFilter } from '../../src/views/desk.ts';
import { deskHref } from '../../src/views/desk-href.ts';
import { FilterTabs } from '../filter-tabs.tsx';

/** The incoming payments outcome filters, with a count on each for the chosen date range. */
export function DeskTabs({ counts, filter, range }: { counts: Record<DeskFilter, number>; filter: DeskFilter; range: DatePreset }) {
  return (
    <FilterTabs
      label="Filter payments"
      current={filter}
      tabs={DESK_FILTERS.map((option) => ({ id: option.id, label: option.label, href: deskHref({ filter: option.id, range }), count: counts[option.id] }))}
    />
  );
}
