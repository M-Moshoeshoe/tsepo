/** Rows per page on every long list. */
export const PAGE_SIZE = 10;

export interface Page<T> {
  items: T[];
  /** The page shown, from 1, clamped to the pages that exist. */
  page: number;
  pageCount: number;
  total: number;
  /** "11 to 20 of 34", or "No entries" when the list is empty. */
  label: string;
}

/** Reads a page number from the address. Anything that is not a whole number from 1 becomes 1. */
export function parsePage(value: unknown): number {
  if (typeof value !== 'string' || !/^\d{1,4}$/.test(value)) return 1;
  return Math.max(1, Number(value));
}

/** One page of a list. A page past the end shows the last page, never an empty one. */
export function paginate<T>(items: readonly T[], requested: number, size = PAGE_SIZE): Page<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / size));
  const page = Math.min(Math.max(1, requested), pageCount);
  const start = (page - 1) * size;
  const shown = items.slice(start, start + size);
  const label = total === 0 ? 'No entries' : `${String(start + 1)} to ${String(start + shown.length)} of ${String(total)}`;
  return { items: shown, page, pageCount, total, label };
}
