import { z } from 'zod';
import { utcDay } from '../domain/time.ts';
import { collection, type DocumentStore } from '../storage/store.ts';
import type { PayoutParser } from './payout-parser.ts';

/** The most Claude calls the payout agent may make in one UTC day. */
export const DAILY_MODEL_CALL_LIMIT = 50;

const CallCountSchema = z.strictObject({
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  count: z.number().int().nonnegative(),
});

/** Thrown instead of calling the model once today's calls are used up. */
export class CallBudgetExceededError extends Error {
  readonly limit: number;

  constructor(limit: number) {
    super(`The daily limit of ${limit} Claude calls is reached; no more calls until tomorrow (UTC)`);
    this.name = 'CallBudgetExceededError';
    this.limit = limit;
  }
}

export interface CallBudget {
  /** Counts one call, or throws when today's limit is already reached. */
  take(): Promise<void>;
}

/**
 * A persistent daily call counter. A call is counted before it is made, so
 * a call that fails still counts, and the count survives restarts.
 */
export function createDailyCallBudget(store: DocumentStore, limit: number, now: () => Date = () => new Date()): CallBudget {
  const counts = collection(store, 'model-calls', CallCountSchema);
  return {
    async take() {
      const day = utcDay(now());
      const used = (await counts.get(day))?.count ?? 0;
      if (used >= limit) throw new CallBudgetExceededError(limit);
      await counts.put(day, { day, count: used + 1 });
    },
  };
}

/** Wraps a parser so that every parse spends one call from the budget first. Fails closed. */
export function withCallBudget(parser: PayoutParser, budget: CallBudget): PayoutParser {
  return {
    async parse(text) {
      await budget.take();
      return parser.parse(text);
    },
  };
}
