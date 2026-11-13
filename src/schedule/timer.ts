import { randomBytes } from 'node:crypto';

/** How often the server checks whether the payout schedule is due. The interval the business sets is in minutes. */
const CHECK_EVERY_MS = 30_000;

/** The header that carries this process's own token, so only the timer can start a scheduled turn. */
export const SCHEDULE_TOKEN_HEADER = 'x-tsepo-schedule';

const timer = globalThis as typeof globalThis & { tsepoScheduleToken?: string; tsepoScheduleTimer?: ReturnType<typeof setInterval> };

/** The token of the running timer, or undefined when no timer runs in this process. */
export function scheduleToken(): string | undefined {
  return timer.tsepoScheduleToken;
}

/**
 * Starts the payout schedule's timer, once per server process. Every 30
 * seconds it asks this same server for one scheduled turn. The turn runs in a
 * route, beside the run lock and the hourly limit that visitors' runs use.
 * The token is random per process and never leaves it.
 */
export function startScheduleTimer(port: string): void {
  if (timer.tsepoScheduleTimer !== undefined) return;
  const token = randomBytes(32).toString('hex');
  timer.tsepoScheduleToken = token;
  timer.tsepoScheduleTimer = setInterval(() => {
    fetch(`http://127.0.0.1:${port}/api/schedule/tick`, { method: 'POST', headers: { [SCHEDULE_TOKEN_HEADER]: token } }).catch((error: unknown) => {
      console.error('[schedule] the scheduled check could not reach the server', error instanceof Error ? error.message : 'unknown error');
    });
  }, CHECK_EVERY_MS);
  timer.tsepoScheduleTimer.unref();
}
