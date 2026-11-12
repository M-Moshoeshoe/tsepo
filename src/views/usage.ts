import { formatUnits, toUnits } from '../domain/amount.ts';
import { sastDay } from '../domain/time.ts';
import type { PolicyLogEntry } from '../policy/records.ts';

/** The action the approval service logs when the sample workspace clears today's totals. */
const SAMPLE_TOTALS_CLEARED = 'clear-daily-totals-for-demo';

/**
 * When today's totals were last cleared for the sample workspace, if that
 * happened today (SAST). The today meter says so, because a cleared total
 * counts less than was paid today.
 */
export function totalsClearedToday(log: readonly PolicyLogEntry[], now: Date): string | undefined {
  const today = sastDay(now);
  return log
    .filter((entry) => entry.kind === 'admin' && entry.action === SAMPLE_TOTALS_CLEARED && sastDay(new Date(entry.at)) === today)
    .map((entry) => entry.at)
    .sort()
    .at(-1);
}

export interface DailyUsage {
  used: string;
  left: string;
  limit: string;
  /** Whole percent of the limit used, 0 to 100. */
  percent: number;
  /** "Daily limit: 5 RLUSD. 2 used, 3 left" */
  sentence: string;
}

/** How much of the daily limit is used and left. Never shows less than zero left. */
export function dailyUsage(used: string, limit: string): DailyUsage {
  const usedUnits = toUnits(used);
  const limitUnits = toUnits(limit);
  const leftUnits = usedUnits >= limitUnits ? 0n : limitUnits - usedUnits;
  const percent = limitUnits === 0n ? 100 : Math.min(100, Number((usedUnits * 100n) / limitUnits));
  const left = formatUnits(leftUnits);
  return { used, left, limit, percent, sentence: `Daily limit: ${limit} RLUSD. ${used} used, ${left} left` };
}
