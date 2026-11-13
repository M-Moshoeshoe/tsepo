import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { CallBudgetExceededError } from '../agent/call-budget.ts';
import { createMemoryStore } from '../storage/memory-store.ts';
import { runScheduledTurn, type SchedulerDeps } from './scheduler.ts';
import { INBOX_LIMIT, InboxFullError, scheduleStore, type ScheduleStore } from './store.ts';

const NOW = new Date('2026-11-13T10:00:00.000Z');

async function inboxWith(texts: string[]): Promise<ScheduleStore> {
  const store = scheduleStore(createMemoryStore());
  for (const [index, text] of texts.entries()) {
    await store.add({ id: randomUUID(), text, addedAt: new Date(NOW.getTime() - (texts.length - index) * 1000).toISOString() });
  }
  return store;
}

/** A scheduler with a free ledger, an active agent and room in the run limit, recording what it ran. */
function deps(store: ScheduleStore, overrides: Partial<SchedulerDeps> = {}): SchedulerDeps & { ran: string[]; locked: () => boolean } {
  let lock = false;
  const ran: string[] = [];
  return {
    store,
    now: () => NOW,
    isRunActive: () => lock,
    acquireLock: () => {
      if (lock) return false;
      lock = true;
      return true;
    },
    releaseLock: () => {
      lock = false;
    },
    takeRunSlot: () => true,
    agentActive: () => Promise.resolve(true),
    runInstruction: (text) => {
      ran.push(text);
      return Promise.resolve();
    },
    log: () => undefined,
    ran,
    locked: () => lock,
    ...overrides,
  };
}

describe('a scheduled turn', () => {
  it('processes the whole inbox, oldest first, with no click, and leaves the ledger free', async () => {
    const store = await inboxWith(['Pay Naledi 2 RLUSD', 'Pay Thabo 1 RLUSD']);
    const d = deps(store);
    expect(await runScheduledTurn(d)).toEqual({ ran: 2 });
    expect(d.ran).toEqual(['Pay Naledi 2 RLUSD', 'Pay Thabo 1 RLUSD']);
    expect(await store.inbox()).toEqual([]);
    expect(d.locked()).toBe(false);
    expect(await store.lastCheckAt()).toBe(NOW.toISOString());
  });

  it('does nothing while the schedule is off', async () => {
    const store = await inboxWith(['Pay Naledi 2 RLUSD']);
    await store.saveSettings({ enabled: false, everyMinutes: 10 }, new Date(NOW.getTime() - 60 * 60_000));
    const d = deps(store);
    expect(await runScheduledTurn(d)).toEqual({ ran: 0, hold: 'off' });
    expect(d.ran).toEqual([]);
  });

  it('waits until the interval has passed', async () => {
    const store = await inboxWith(['Pay Naledi 2 RLUSD']);
    await store.saveSettings({ enabled: true, everyMinutes: 10 }, new Date(NOW.getTime() - 4 * 60_000));
    expect(await runScheduledTurn(deps(store))).toEqual({ ran: 0, hold: 'not-due' });
  });

  it('starts nothing when the inbox is empty, and counts that as its turn', async () => {
    const store = await inboxWith([]);
    const d = deps(store, { takeRunSlot: () => expect.unreachable('an empty inbox uses no run slot') });
    expect(await runScheduledTurn(d)).toEqual({ ran: 0, hold: 'empty' });
    expect(await store.lastCheckAt()).toBe(NOW.toISOString());
  });

  it('runs one at a time: it waits while another run holds the ledger, and keeps its turn', async () => {
    const store = await inboxWith(['Pay Naledi 2 RLUSD']);
    const d = deps(store, { isRunActive: () => true });
    expect(await runScheduledTurn(d)).toEqual({ ran: 0, hold: 'busy' });
    expect(await store.inbox()).toHaveLength(1);
    expect(await store.lastCheckAt()).toBeUndefined();
  });

  it('pauses while the agent is revoked, and keeps the instructions for later', async () => {
    const store = await inboxWith(['Pay Naledi 2 RLUSD']);
    const d = deps(store, { agentActive: () => Promise.resolve(false) });
    expect(await runScheduledTurn(d)).toEqual({ ran: 0, hold: 'paused' });
    expect(d.ran).toEqual([]);
    expect(await store.inbox()).toHaveLength(1);
    expect(d.locked()).toBe(false);
  });

  it('counts each instruction against the hourly run limit, and stops when it is reached', async () => {
    const store = await inboxWith(['first', 'second', 'third']);
    let slots = 1;
    const d = deps(store, { takeRunSlot: () => slots-- > 0 });
    expect(await runScheduledTurn(d)).toEqual({ ran: 1, stoppedBy: 'run-limit' });
    expect((await store.inbox()).map((item) => item.text)).toEqual(['second', 'third']);
  });

  it('stops at the daily Claude limit and puts the instruction back, unread', async () => {
    const store = await inboxWith(['first', 'second']);
    const d = deps(store, { runInstruction: () => Promise.reject(new CallBudgetExceededError(150)) });
    expect(await runScheduledTurn(d)).toEqual({ ran: 0, stoppedBy: 'claude-cap' });
    expect((await store.inbox()).map((item) => item.text)).toEqual(['first', 'second']);
  });

  it('fails closed: an instruction that failed is not retried, and the turn stops', async () => {
    const store = await inboxWith(['first', 'second']);
    const logged: string[] = [];
    const d = deps(store, { runInstruction: () => Promise.reject(new Error('the ledger was unreachable')), log: (line) => logged.push(line) });
    expect(await runScheduledTurn(d)).toEqual({ ran: 1, stoppedBy: 'error' });
    expect((await store.inbox()).map((item) => item.text)).toEqual(['second']);
    expect(logged.join(' ')).not.toContain('first');
    expect(d.locked()).toBe(false);
  });
});

describe('the instruction inbox', () => {
  it(`holds at most ${String(INBOX_LIMIT)} instructions`, async () => {
    const store = await inboxWith(Array.from({ length: INBOX_LIMIT }, (_, index) => `Pay Naledi ${String(index + 1)} RLUSD`));
    await expect(store.add({ id: randomUUID(), text: 'one too many', addedAt: NOW.toISOString() })).rejects.toBeInstanceOf(InboxFullError);
  });

  it('counts a new interval from the moment the setting changes', async () => {
    const store = await inboxWith([]);
    await store.saveSettings({ enabled: true, everyMinutes: 5 }, NOW);
    expect(await store.settings()).toEqual({ enabled: true, everyMinutes: 5 });
    expect(await store.lastCheckAt()).toBe(NOW.toISOString());
  });
});
