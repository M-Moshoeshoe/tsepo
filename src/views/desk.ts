import { sastDay } from '../domain/time.ts';
import { daysInRange, inRange, type DatePreset } from './date-range.ts';
import { storyTitle } from './scenarios.ts';
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

/** Items in the date range, newest first. */
export function itemsInRange<T extends DeskItem>(items: readonly T[], range: DatePreset, now: Date): T[] {
  return items.filter((item) => inRange(item.at, range, now)).sort((a, b) => b.at.localeCompare(a.at));
}

/** One SAST day of the outcomes chart: how many items ended in each outcome. */
export interface OutcomeDay {
  day: string;
  counts: Record<Category, number>;
}

/** The outcome order, fixed everywhere: the chart, its legend and its table. */
export const OUTCOMES: readonly Category[] = ['cleared', 'held', 'refused', 'rejected'];

/**
 * Outcomes per SAST day across the date range, oldest first, with every day
 * present even when empty. The totals equal countByFilter for the same items,
 * so the chart and the table always agree.
 */
export function outcomesByDay(items: readonly DeskItem[], range: DatePreset, now: Date): { days: OutcomeDay[]; totals: Record<Category, number> } {
  const shown = itemsInRange(items, range, now);
  const earliest = shown.at(-1)?.at;
  const days = daysInRange(range, now, earliest).map((day) => ({ day, counts: { cleared: 0, held: 0, refused: 0, rejected: 0 } }));
  const byDay = new Map(days.map((entry) => [entry.day, entry]));
  const totals: Record<Category, number> = { cleared: 0, held: 0, refused: 0, rejected: 0 };
  for (const item of shown) {
    totals[item.status.category] += 1;
    const bucket = byDay.get(sastDay(new Date(item.at)));
    if (bucket !== undefined) bucket.counts[item.status.category] += 1;
  }
  return { days, totals };
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
      return { title: 'No payments yet.', next: `Run "${storyTitle('scenario-2')}" in the guided tour to see one.` };
    case 'cleared':
      return { title: 'No cleared payments yet.', next: `Run "${storyTitle('scenario-2')}" in the guided tour to see one.` };
    case 'held':
      return {
        title: 'No held payments.',
        next: 'A payment is held when it arrives without matching Travel Rule details or a credential.',
      };
    case 'refused':
      return {
        title: 'No refused attempts yet.',
        next: `Run "${storyTitle('scenario-3')}" in the guided tour to see the approval service refuse one.`,
      };
    case 'rejected':
      return {
        title: 'No ledger rejections yet.',
        next: `Run "${storyTitle('scenario-1')}" in the guided tour to see the XRP Ledger reject one.`,
      };
  }
}

/** The name shown for a sender that no business registered. */
export const UNREGISTERED_AGENT = 'Unregistered agent';
