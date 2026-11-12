import type { Actor, RunKind } from '../demo/events.ts';

export type ScenarioKind = Extract<RunKind, `scenario-${string}`>;

export interface Scenario {
  kind: ScenarioKind;
  number: number;
  title: string;
  /** One plain line on what the scenario proves. */
  proves: string;
  /** Who cleared or stopped the scenario's payment. */
  decidedBy: Actor;
}

/** The four demo scenarios, in the order they are told. */
export const SCENARIOS: readonly Scenario[] = [
  {
    kind: 'scenario-1',
    number: 1,
    title: 'Unknown agent',
    proves: 'An agent without a credential cannot pay the agent lane; the ledger rejects it with tecNO_PERMISSION.',
    decidedBy: 'ledger',
  },
  {
    kind: 'scenario-2',
    number: 2,
    title: 'Verified agent',
    proves: 'A registered agent pays 2 RLUSD on its own, and the exchange clears it because every check passes.',
    decidedBy: 'exchange',
  },
  {
    kind: 'scenario-3',
    number: 3,
    title: 'Split payments',
    proves: 'Splitting a payment into smaller parts does not get around the 5 RLUSD daily limit.',
    decidedBy: 'policy',
  },
  {
    kind: 'scenario-4',
    number: 4,
    title: 'Revoke',
    proves: 'The business revokes its agent at once, and the next payment is refused.',
    decidedBy: 'policy',
  },
];

export function scenarioLabel(scenario: Scenario): string {
  return `Scenario ${scenario.number}: ${scenario.title}`;
}
