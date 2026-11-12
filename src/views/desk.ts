import { CATEGORY_CHIPS, type Category, type Status } from './status.ts';

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

/** What to show, and what to do next, when the desk has nothing under a filter. */
export function emptyDeskText(filter: DeskFilter): { title: string; next: string } {
  switch (filter) {
    case 'all':
      return { title: 'No payments yet.', next: 'Run scenario 2 to see a cleared payment.' };
    case 'cleared':
      return { title: 'No cleared payments yet.', next: 'Run scenario 2 to see one.' };
    case 'held':
      return {
        title: 'No held payments.',
        next: 'A payment is held when it arrives without a matching travel package or credential.',
      };
    case 'refused':
      return { title: 'No refused attempts yet.', next: 'Run scenario 3 to see the policy service refuse a split payment.' };
    case 'rejected':
      return { title: 'No ledger rejections yet.', next: 'Run scenario 1 to see the ledger reject an unknown agent.' };
  }
}
