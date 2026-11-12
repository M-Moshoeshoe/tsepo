import { DEFAULT_RANGE, type DatePreset } from './date-range.ts';
import type { DeskFilter } from './desk.ts';

/** Where the exchange's incoming payments live. */
export const EXCHANGE_PAYMENTS_PATH = '/exchange/payments';

/** Builds an incoming payments address that keeps the current filters. Defaults are left out. */
export function deskHref(query: { filter: DeskFilter; range: DatePreset; page?: number; entry?: string | undefined }): string {
  const params = new URLSearchParams();
  if (query.filter !== 'all') params.set('filter', query.filter);
  if (query.range !== DEFAULT_RANGE) params.set('range', query.range);
  if (query.page !== undefined && query.page > 1) params.set('page', String(query.page));
  if (query.entry !== undefined) params.set('entry', query.entry);
  const text = params.toString();
  return text === '' ? EXCHANGE_PAYMENTS_PATH : `${EXCHANGE_PAYMENTS_PATH}?${text}`;
}
