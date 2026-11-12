import { z } from 'zod';
import { collection, type DocumentStore } from '../storage/store.ts';

const DemoStateSchema = z.strictObject({
  /** When the last successful reset began. Screens show activity from this time by default. */
  lastResetAt: z.iso.datetime(),
});

export interface DemoState {
  lastResetAt(): Promise<string | undefined>;
  recordReset(startedAt: string): Promise<void>;
}

export function demoState(store: DocumentStore): DemoState {
  const records = collection(store, 'state', DemoStateSchema);
  return {
    async lastResetAt() {
      return (await records.get('demo'))?.lastResetAt;
    },
    async recordReset(startedAt) {
      await records.put('demo', { lastResetAt: startedAt });
    },
  };
}
