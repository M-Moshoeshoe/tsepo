'use client';

import { PlayCircle } from '@untitledui/icons';
import { Table } from '@/components/application/table/table';
import { Button } from '@/components/base/buttons/button';
import { SCENARIOS, scenarioLabel, type ScenarioKind } from '../../src/views/scenarios.ts';
import { formatSast } from '../../src/views/status.ts';
import type { LastResult } from '../../app/_data/home.ts';
import { StatusBadge } from '../display.tsx';
import { useDemoActions } from '../shell/demo-actions.tsx';

const HEAD = 'px-4 lg:px-5';
const CELL = 'px-4 py-3 lg:px-5 align-top';

function sentenceCase(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

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
      {result.summary !== undefined && <span className="text-primary">{result.summary}</span>}
    </span>
  );
}

/** The four scenarios in the order they are told, what each proves, and a Run button for each. */
export function Runbook({ lastResults }: { lastResults: Partial<Record<ScenarioKind, LastResult>> }) {
  const { busy, runScenario } = useDemoActions();
  return (
    <Table size="sm" aria-label="Demo runbook">
      <Table.Header>
        <Table.Head id="scenario" label="Scenario" isRowHeader className={HEAD} />
        <Table.Head id="decided" label="Decided by" className={`${HEAD} w-36 max-md:hidden`} />
        <Table.Head id="last" label="Last result" className={`${HEAD} w-48 max-sm:hidden`} />
        <Table.Head id="run" label="Run" className={`${HEAD} w-24 *:justify-end`} />
      </Table.Header>
      <Table.Body items={SCENARIOS.map((scenario) => ({ ...scenario, id: scenario.kind }))}>
        {(scenario) => (
          <Table.Row id={scenario.id} className="h-auto" textValue={scenarioLabel(scenario)}>
            <Table.Cell className={CELL}>
              <span className="grid gap-0.5">
                <span className="font-semibold text-primary">
                  <span className="text-brand-secondary tabular-nums">{scenario.number}</span> {scenario.title}
                </span>
                <span className="text-tertiary">{scenario.proves}</span>
              </span>
            </Table.Cell>
            <Table.Cell className={`${CELL} max-md:hidden`}>{sentenceCase(scenario.decidedBy)}</Table.Cell>
            <Table.Cell className={`${CELL} max-sm:hidden`}>
              <LastResultCell result={lastResults[scenario.kind]} />
            </Table.Cell>
            <Table.Cell className={`${CELL} text-right whitespace-nowrap`}>
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
            </Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </Table>
  );
}
