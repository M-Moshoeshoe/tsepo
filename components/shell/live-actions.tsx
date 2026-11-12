'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import type { RunRequest } from '../../src/demo/events.ts';
import { SCENARIOS, scenarioLabel, type ScenarioKind } from '../../src/views/scenarios.ts';
import { useRun } from '../run-provider.tsx';

/** The label of the action that puts the sample workspace back in its starting state. */
export const RESTORE_LABEL = 'Restore sample data';

interface LiveActions {
  busy: boolean;
  locked: boolean;
  /** Starts a live step on Testnet, or asks for the access code first when none is saved. */
  run: (request: RunRequest, label: string) => void;
  runStory: (kind: ScenarioKind) => void;
  restore: () => void;
  unlock: () => void;
}

const LiveActionsContext = createContext<LiveActions | null>(null);

/** One place that decides how every live action behaves: the tour stories, Restore, Change limits and Revoke. */
export function LiveActionsProvider({ onUnlock, children }: { onUnlock: () => void; children: ReactNode }) {
  const { accessCode, busy, start } = useRun();
  const locked = accessCode === undefined;

  const run = useCallback(
    (request: RunRequest, label: string) => {
      if (locked) onUnlock();
      else start(request, label);
    },
    [locked, onUnlock, start],
  );

  const runStory = useCallback(
    (kind: ScenarioKind) => {
      const scenario = SCENARIOS.find((item) => item.kind === kind);
      if (scenario !== undefined) run({ kind }, scenarioLabel(scenario));
    },
    [run],
  );

  const restore = useCallback(() => {
    run({ kind: 'reset' }, RESTORE_LABEL);
  }, [run]);

  const value = useMemo(
    () => ({ busy, locked, run, runStory, restore, unlock: onUnlock }),
    [busy, locked, run, runStory, restore, onUnlock],
  );
  return <LiveActionsContext.Provider value={value}>{children}</LiveActionsContext.Provider>;
}

export function useLiveActions(): LiveActions {
  const value = useContext(LiveActionsContext);
  if (value === null) throw new Error('useLiveActions must be used inside LiveActionsProvider');
  return value;
}
