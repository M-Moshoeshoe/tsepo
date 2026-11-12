import { describe, expect, it } from 'vitest';
import { createMemoryStore } from '../storage/memory-store.ts';
import { demoState } from './state.ts';

describe('demo state', () => {
  it('keeps the last reset time and the latest result of each scenario', async () => {
    const state = demoState(createMemoryStore());
    expect(await state.lastResetAt()).toBeUndefined();
    await state.recordReset('2026-11-12T16:00:00.000Z');
    await state.recordRun({ kind: 'scenario-1', at: '2026-11-12T16:01:00.000Z', outcome: 'finished', summary: 'first' });
    await state.recordRun({ kind: 'scenario-1', at: '2026-11-12T16:05:00.000Z', outcome: 'stopped', summary: 'second' });
    expect(await state.lastResetAt()).toBe('2026-11-12T16:00:00.000Z');
    expect(await state.lastRuns()).toEqual([{ kind: 'scenario-1', at: '2026-11-12T16:05:00.000Z', outcome: 'stopped', summary: 'second' }]);
  });
});
