import 'server-only';
import type { CurrentRun, DemoEvent, RunKind } from '../../../src/demo/events.ts';

/** How long a finished run stays readable, so a page refreshed near the end still sees how it ended. */
const KEEP_FINISHED_MS = 2 * 60 * 1000;

const memory = globalThis as typeof globalThis & { tsepoCurrentRun?: CurrentRun & { finishedAt?: number } };

/** Starts recording a run's progress. One run at a time: the run lock guarantees it. */
export function beginRun(kind: RunKind): (event: DemoEvent) => void {
  const run: CurrentRun & { finishedAt?: number } = { kind, startedAt: Date.now(), finished: false, events: [] };
  memory.tsepoCurrentRun = run;
  return (event) => {
    run.events.push(event);
  };
}

export function endRun(): void {
  const run = memory.tsepoCurrentRun;
  if (run === undefined) return;
  run.finished = true;
  run.finishedAt = Date.now();
}

/** The run going on now, or one that ended in the last two minutes. */
export function currentRun(now = Date.now()): CurrentRun | null {
  const run = memory.tsepoCurrentRun;
  if (run === undefined) return null;
  if (run.finishedAt !== undefined && now - run.finishedAt > KEEP_FINISHED_MS) return null;
  return { kind: run.kind, startedAt: run.startedAt, finished: run.finished, events: [...run.events] };
}
