import type { DeskFilter } from '../../src/views/desk.ts';

/** Builds a desk address that keeps the current filter and time window. */
export function deskHref(query: { filter: DeskFilter; earlier: boolean; entry?: string | undefined }): string {
  const params = new URLSearchParams();
  if (query.filter !== 'all') params.set('filter', query.filter);
  if (query.earlier) params.set('earlier', '1');
  if (query.entry !== undefined) params.set('entry', query.entry);
  const text = params.toString();
  return text === '' ? '/compliance' : `/compliance?${text}`;
}
