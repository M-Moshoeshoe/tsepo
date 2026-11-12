'use client';

import { PlayCircle } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { actorName, decisionNote } from '../../src/views/actors.ts';
import { SCENARIOS, scenarioLabel, type ScenarioKind } from '../../src/views/scenarios.ts';
import { formatSast } from '../../src/views/status.ts';
import type { LastResult } from '../../app/_data/home.ts';
import { StatusBadge } from '../display.tsx';
import { useDemoActions } from '../shell/demo-actions.tsx';

const HEAD = 'px-4 py-2.5 text-left text-xs font-semibold text-quaternary lg:px-5';
const CELL = 'px-4 py-3 align-top lg:px-5';

function LastResultCell({ result }: { result: LastResult | undefined }) {
  if (result === undefined) return <span className="text-tertiary">Not run yet</span>;
  return (
    <span className="grid gap-1">
      <span className="flex flex-wrap items-center gap-2">
        <StatusBadge tone={result.outcome === 'finished' ? 'cleared' : 'refused'}>
          {result.outcome === 'finished' ? 'Finished' : 'Stopped'}
        </StatusBadge>
        <span className="text-xs text-tertiary tabular-nums">{formatSast(result.at)}</span>
      </span>
      <span className="text-primary">{result.summary}</span>
    </span>
  );
}

/**
 * The four scenarios in the order they are told, what each proves, and a Run
 * button for each. A plain table, so Tab reaches every Run button. Each
 * scenario prepares its own starting state, so they run in any order.
 */
export function Runbook({ lastResults }: { lastResults: Partial<Record<ScenarioKind, LastResult>> }) {
  const { busy, runScenario } = useDemoActions();
  return (
    <table className="w-full text-sm">
      <caption className="sr-only">Demo runbook: the four scenarios, who decides each, and the last result</caption>
      <thead className="bg-secondary">
        <tr>
          <th scope="col" className={HEAD}>
            Scenario
          </th>
          <th scope="col" className={`${HEAD} w-44 max-md:hidden`}>
            Decided by
          </th>
          <th scope="col" className={`${HEAD} w-56 max-sm:hidden`}>
            Last result
          </th>
          <th scope="col" className={`${HEAD} w-24 text-right`}>
            Run
          </th>
        </tr>
      </thead>
      <tbody>
        {SCENARIOS.map((scenario) => (
          <tr key={scenario.kind} className="border-t border-secondary">
            <th scope="row" className={`${CELL} text-left font-normal`}>
              <span className="grid gap-0.5">
                <span className="font-semibold text-primary">
                  <span className="text-brand-secondary tabular-nums">{scenario.number}</span> {scenario.title}
                </span>
                <span className="text-tertiary">{scenario.proves}</span>
              </span>
            </th>
            <td className={`${CELL} text-secondary max-md:hidden`}>
              <span className="grid gap-0.5">
                <span>{actorName(scenario.decidedBy, true)}</span>
                {scenario.decidedBy === 'exchange' && (
                  <span className="text-xs text-tertiary">{decisionNote(scenario.decidedBy, 'cleared')}</span>
                )}
              </span>
            </td>
            <td className={`${CELL} max-sm:hidden`}>
              <LastResultCell result={lastResults[scenario.kind]} />
            </td>
            <td className={`${CELL} text-right whitespace-nowrap`}>
              <Button
                color="secondary"
                size="sm"
                iconLeading={PlayCircle}
                isDisabled={busy}
                aria-label={`Run ${scenarioLabel(scenario)}`}
                onClick={() => {
                  runScenario(scenario.kind);
                }}
              >
                Run
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
