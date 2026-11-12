'use client';

import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react';
import type { RunRequest } from '../../src/demo/events.ts';
import { SCENARIOS, scenarioLabel, type ScenarioKind } from '../../src/views/scenarios.ts';
import { useRun } from '../run-provider.tsx';

interface DemoActions {
  busy: boolean;
  locked: boolean;
  /** Starts a run, or asks for the access code first when the demo is locked. */
  run: (request: RunRequest, label: string) => void;
  runScenario: (kind: ScenarioKind) => void;
  reset: () => void;
  unlock: () => void;
}

const DemoActionsContext = createContext<DemoActions | null>(null);

/** One place that decides how the demo controls behave, used by the header, the home runbook and the agent page. */
export function DemoActionsProvider({ onUnlock, children }: { onUnlock: () => void; children: ReactNode }) {
  const { accessCode, busy, start } = useRun();
  const locked = accessCode === undefined;

  const run = useCallback(
    (request: RunRequest, label: string) => {
      if (locked) onUnlock();
      else start(request, label);
    },
    [locked, onUnlock, start],
  );

  const runScenario = useCallback(
    (kind: ScenarioKind) => {
      const scenario = SCENARIOS.find((item) => item.kind === kind);
      if (scenario !== undefined) run({ kind }, scenarioLabel(scenario));
    },
    [run],
  );

  const reset = useCallback(() => {
    run({ kind: 'reset' }, 'Reset demo');
  }, [run]);

  const value = useMemo(
    () => ({ busy, locked, run, runScenario, reset, unlock: onUnlock }),
    [busy, locked, run, runScenario, reset, onUnlock],
  );
  return <DemoActionsContext.Provider value={value}>{children}</DemoActionsContext.Provider>;
}

export function useDemoActions(): DemoActions {
  const value = useContext(DemoActionsContext);
  if (value === null) throw new Error('useDemoActions must be used inside DemoActionsProvider');
  return value;
}
