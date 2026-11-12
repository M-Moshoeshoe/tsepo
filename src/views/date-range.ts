import { sastDay } from '../domain/time.ts';

/** The date presets every list offers. Days are counted in SAST. */
export type DatePreset = 'today' | '7d' | '30d' | 'all';

export const DATE_PRESETS: { id: DatePreset; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: '7d', label: 'Last 7 days' },
  { id: '30d', label: 'Last 30 days' },
  { id: 'all', label: 'All time' },
];

export const DEFAULT_RANGE: DatePreset = '7d';

const DAY_MS = 24 * 60 * 60 * 1000;

/** The longest span a chart draws for "All time", so a long history never squeezes the columns to nothing. */
export const MAX_CHART_DAYS = 60;

export function parseRange(value: unknown): DatePreset {
  return DATE_PRESETS.find((preset) => preset.id === value)?.id ?? DEFAULT_RANGE;
}

function presetDays(range: Exclude<DatePreset, 'all'>): number {
  return range === 'today' ? 1 : range === '7d' ? 7 : 30;
}

/** True when `at` falls in the preset, counted in whole SAST days, today included. */
export function inRange(at: string, range: DatePreset, now: Date): boolean {
  if (range === 'all') return true;
  const first = sastDay(new Date(now.getTime() - (presetDays(range) - 1) * DAY_MS));
  return sastDay(new Date(at)) >= first;
}

/**
 * Every SAST day the preset covers, oldest first, as YYYY-MM-DD. For "All time"
 * it starts at the earliest item's day, at most MAX_CHART_DAYS back.
 */
export function daysInRange(range: DatePreset, now: Date, earliest: string | undefined): string[] {
  const today = sastDay(now);
  let count: number;
  if (range === 'all') {
    const first = earliest === undefined ? today : sastDay(new Date(earliest));
    count = Math.round((Date.parse(today) - Date.parse(first)) / DAY_MS) + 1;
  } else {
    count = presetDays(range);
  }
  return lastDays(Math.min(Math.max(count, 1), MAX_CHART_DAYS), now);
}

/** The last `count` SAST days, oldest first, today included. */
export function lastDays(count: number, now: Date): string[] {
  return Array.from({ length: count }, (_, index) => sastDay(new Date(now.getTime() - (count - 1 - index) * DAY_MS)));
}

/** "12 Nov" for an axis and "12 November 2026" for a tooltip or table, from a YYYY-MM-DD SAST day. */
export function dayLabels(day: string): { short: string; full: string } {
  const noon = new Date(`${day}T12:00:00Z`);
  const format = (options: Intl.DateTimeFormatOptions): string => new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...options }).format(noon);
  return { short: format({ day: 'numeric', month: 'short' }), full: format({ day: 'numeric', month: 'long', year: 'numeric' }) };
}
