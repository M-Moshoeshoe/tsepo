import { CATEGORY_CHIPS, formatSastDate, type Category, type Status } from './status.ts';

export interface DeskItem {
  at: string;
  status: Status;
}

export type DeskFilter = 'all' | Category;

export const DESK_FILTERS: { id: DeskFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  ...(Object.keys(CATEGORY_CHIPS) as Category[]).map((id) => ({ id, label: CATEGORY_CHIPS[id] })),
];

export function parseDeskFilter(value: string | undefined): DeskFilter {
  return DESK_FILTERS.some((filter) => filter.id === value) ? (value as DeskFilter) : 'all';
}

/** Items at or after `since`, newest first. With no `since`, every item. */
export function itemsSince<T extends DeskItem>(items: readonly T[], since: string | undefined): T[] {
  return items.filter((item) => since === undefined || item.at >= since).sort((a, b) => b.at.localeCompare(a.at));
}

export function countByFilter(items: readonly DeskItem[]): Record<DeskFilter, number> {
  const counts: Record<DeskFilter, number> = { all: items.length, cleared: 0, held: 0, refused: 0, rejected: 0 };
  for (const item of items) counts[item.status.category] += 1;
  return counts;
}

export function applyFilter<T extends DeskItem>(items: readonly T[], filter: DeskFilter): T[] {
  return filter === 'all' ? [...items] : items.filter((item) => item.status.category === filter);
}

/** Groups items (already newest first) under their SAST calendar date. */
export function groupBySastDate<T extends DeskItem>(items: readonly T[]): { date: string; items: T[] }[] {
  const groups: { date: string; items: T[] }[] = [];
  for (const item of items) {
    const date = formatSastDate(item.at);
    const last = groups.at(-1);
    if (last?.date === date) last.items.push(item);
    else groups.push({ date, items: [item] });
  }
  return groups;
}
