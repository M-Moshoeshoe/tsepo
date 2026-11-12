import type { DeskFilter } from './desk.ts';

/** Where the exchange's incoming payments live. */
export const EXCHANGE_PAYMENTS_PATH = '/exchange/payments';

/** Builds an incoming payments address that keeps the current filter and time window. */
export function deskHref(query: { filter: DeskFilter; earlier: boolean; entry?: string | undefined }): string {
  const params = new URLSearchParams();
  if (query.filter !== 'all') params.set('filter', query.filter);
  if (query.earlier) params.set('earlier', '1');
  if (query.entry !== undefined) params.set('entry', query.entry);
  const text = params.toString();
  return text === '' ? EXCHANGE_PAYMENTS_PATH : `${EXCHANGE_PAYMENTS_PATH}?${text}`;
}
