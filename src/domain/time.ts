/** South African Standard Time is UTC+2 all year, with no daylight saving. */
const SAST_OFFSET_MS = 2 * 60 * 60 * 1000;

/** The UTC calendar day, as YYYY-MM-DD. */
export function utcDay(moment: Date): string {
  return moment.toISOString().slice(0, 10);
}

/** The calendar day in South Africa (SAST), as YYYY-MM-DD. Daily limits count against this day. */
export function sastDay(moment: Date): string {
  return new Date(moment.getTime() + SAST_OFFSET_MS).toISOString().slice(0, 10);
}
