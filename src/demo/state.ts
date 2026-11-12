import { z } from 'zod';
import { collection, type DocumentStore } from '../storage/store.ts';

const DemoStateSchema = z.strictObject({
  /** When the last successful reset began. Screens show activity from this time by default. */
  lastResetAt: z.iso.datetime(),
});

const LastRunSchema = z.strictObject({
  kind: z.string(),
  at: z.iso.datetime(),
  outcome: z.enum(['finished', 'stopped']),
  summary: z.string().max(400),
});

export type LastRun = z.infer<typeof LastRunSchema>;

export interface DemoState {
  lastResetAt(): Promise<string | undefined>;
  recordReset(startedAt: string): Promise<void>;
  /** The latest result of each scenario, for the home runbook. */
  recordRun(run: LastRun): Promise<void>;
  lastRuns(): Promise<LastRun[]>;
}

export function demoState(store: DocumentStore): DemoState {
  const records = collection(store, 'state', DemoStateSchema);
  const runs = collection(store, 'last-runs', LastRunSchema);
  return {
    async lastResetAt() {
      return (await records.get('demo'))?.lastResetAt;
    },
    async recordReset(startedAt) {
      await records.put('demo', { lastResetAt: startedAt });
    },
    async recordRun(run) {
      await runs.put(run.kind, run);
    },
    lastRuns: () => runs.list(),
  };
}
