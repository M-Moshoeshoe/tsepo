import type { RunKind } from '../demo/events.ts';

export type ScenarioKind = Extract<RunKind, `scenario-${string}`>;

export interface Scenario {
  kind: ScenarioKind;
  number: number;
  title: string;
  /** One plain line on what the scenario proves. */
  proves: string;
  /** The control that decides the result. */
  decidedBy: 'the XRP Ledger itself' | 'the policy service';
}

/** The four demo scenarios, in the order they are told. */
export const SCENARIOS: readonly Scenario[] = [
  {
    kind: 'scenario-1',
    number: 1,
    title: 'Unknown agent',
    proves: 'An agent without a credential cannot pay the agent lane; the ledger rejects it with tecNO_PERMISSION.',
    decidedBy: 'the XRP Ledger itself',
  },
  {
    kind: 'scenario-2',
    number: 2,
    title: 'Verified agent',
    proves: 'A registered agent pays 2 RLUSD on its own, and the exchange clears it because every check passes.',
    decidedBy: 'the policy service',
  },
  {
    kind: 'scenario-3',
    number: 3,
    title: 'Split payments',
    proves: 'Splitting a payment into smaller parts does not get around the 5 RLUSD daily limit.',
    decidedBy: 'the policy service',
  },
  {
    kind: 'scenario-4',
    number: 4,
    title: 'Revoke',
    proves: 'The business revokes its agent at once, and the next payment is refused.',
    decidedBy: 'the policy service',
  },
];

export function scenarioLabel(scenario: Scenario): string {
  return `Scenario ${scenario.number}: ${scenario.title}`;
}
