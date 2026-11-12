import { describe, expect, it } from 'vitest';
import { createMemoryStore } from '../storage/memory-store.ts';
import { createDailyCallBudget, DAILY_MODEL_CALL_LIMIT, withCallBudget } from './call-budget.ts';
import type { PayoutParser } from './payout-parser.ts';

function countingParser(): PayoutParser & { calls: number } {
  const parser = {
    calls: 0,
    parse() {
      parser.calls += 1;
      return Promise.resolve([]);
    },
  };
  return parser;
}

describe('daily call budget', () => {
  it('is 150 calls a day', () => {
    expect(DAILY_MODEL_CALL_LIMIT).toBe(150);
  });

  it('allows calls up to the limit, then refuses without calling the model', async () => {
    const inner = countingParser();
    const parser = withCallBudget(inner, createDailyCallBudget(createMemoryStore(), 3, () => new Date('2026-11-12T10:00:00Z')));
    for (let i = 0; i < 3; i += 1) await parser.parse('list');
    await expect(parser.parse('list')).rejects.toThrow(/daily limit of 3/);
    expect(inner.calls).toBe(3);
  });

  it('counts a call that fails', async () => {
    const failing: PayoutParser = { parse: () => Promise.reject(new Error('model error')) };
    const store = createMemoryStore();
    const parser = withCallBudget(failing, createDailyCallBudget(store, 1, () => new Date('2026-11-12T10:00:00Z')));
    await expect(parser.parse('list')).rejects.toThrow('model error');
    await expect(parser.parse('list')).rejects.toThrow(/daily limit/);
  });

  it('keeps the count across restarts and starts again the next UTC day', async () => {
    const store = createMemoryStore();
    let now = new Date('2026-11-12T23:59:00Z');
    const first = createDailyCallBudget(store, 1, () => now);
    await first.take();
    await expect(createDailyCallBudget(store, 1, () => now).take()).rejects.toThrow();
    now = new Date('2026-11-13T00:00:01Z');
    await expect(createDailyCallBudget(store, 1, () => now).take()).resolves.toBeUndefined();
  });
});
