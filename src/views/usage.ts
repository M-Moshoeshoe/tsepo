import { formatUnits, toUnits } from '../domain/amount.ts';

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
