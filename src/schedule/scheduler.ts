import { CallBudgetExceededError } from '../agent/call-budget.ts';
import { holdEndsTurn, pausedHold, scheduleHold, type ScheduleHold } from './schedule.ts';
import type { ScheduleStore } from './store.ts';

/** Everything a scheduled turn needs. The real app passes the shared run lock, the hourly limit and the real agent. */
export interface SchedulerDeps {
  store: ScheduleStore;
  now: () => Date;
  /** Another run holds the ledger right now. */
  isRunActive: () => boolean;
  acquireLock: () => boolean;
  releaseLock: () => void;
  /** Counts one run against the hourly limit for all visitors. False when the limit is reached. */
  takeRunSlot: () => boolean;
  /** Reads the ledger: the agent holds a valid credential that matches its spending rules. */
  agentActive: () => Promise<boolean>;
  /** Runs one instruction through the real agent, exactly as when a person sends it, marked as started by the schedule. */
  runInstruction: (text: string) => Promise<void>;
  /** Writes one line to the server log. Never the instruction text: it is untrusted and may hold personal data. */
  log: (line: string) => void;
}

export interface TurnResult {
  /** Instructions the agent processed in this turn. */
  ran: number;
  /** Why nothing ran, when nothing ran. */
  hold?: ScheduleHold;
  /** Why the turn ended before the inbox was empty. */
  stoppedBy?: 'run-limit' | 'claude-cap' | 'error';
}

/**
 * One turn of the payout schedule. When the schedule is on, due, the inbox
 * holds instructions, no other run holds the ledger and the agent is active,
 * the agent processes the inbox by itself, oldest first, with no click. Each
 * instruction counts against the hourly run limit and the daily Claude limit,
 * as it would for a person. Fails closed: an instruction that failed is not
 * retried blindly; one that never started, for want of a run slot or Claude
 * calls, goes back to the front of the inbox.
 */
export async function runScheduledTurn(deps: SchedulerDeps): Promise<TurnResult> {
  const now = deps.now();
  const [settings, lastCheckAt, inbox] = await Promise.all([deps.store.settings(), deps.store.lastCheckAt(), deps.store.inbox()]);
  const hold = scheduleHold({ settings, lastCheckAt, inboxSize: inbox.length, runActive: deps.isRunActive(), now });
  if (hold !== undefined) {
    if (holdEndsTurn(hold)) await deps.store.markChecked(now);
    return { ran: 0, hold };
  }
  if (!deps.acquireLock()) return { ran: 0, hold: 'busy' };
  try {
    await deps.store.markChecked(now);
    const paused = pausedHold(await deps.agentActive());
    if (paused !== undefined) return { ran: 0, hold: paused };

    let ran = 0;
    for (;;) {
      const item = await deps.store.takeOldest();
      if (item === undefined) return { ran };
      if (!deps.takeRunSlot()) {
        await deps.store.putBack(item);
        return { ran, stoppedBy: 'run-limit' };
      }
      try {
        await deps.runInstruction(item.text);
        ran += 1;
      } catch (error: unknown) {
        if (error instanceof CallBudgetExceededError) {
          await deps.store.putBack(item);
          return { ran, stoppedBy: 'claude-cap' };
        }
        deps.log(`[schedule] an instruction from the inbox stopped: ${error instanceof Error ? error.name : 'unknown error'}`);
        return { ran: ran + 1, stoppedBy: 'error' };
      }
    }
  } finally {
    deps.releaseLock();
  }
}
