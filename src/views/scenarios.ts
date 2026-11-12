import type { Actor, RunKind } from '../demo/events.ts';

export type ScenarioKind = Extract<RunKind, `scenario-${string}`>;

/** One live story of the guided tour, backed by one engine scenario. */
export interface Scenario {
  kind: ScenarioKind;
  /** The story, told from the business's side. */
  title: string;
  /** One plain line on what the story proves. */
  proves: string;
  /** Who cleared or stopped the story's payment. */
  decidedBy: Actor;
}

/** The four stories, in the order the guided tour tells them. */
export const SCENARIOS: readonly Scenario[] = [
  {
    kind: 'scenario-2',
    title: 'Your agent pays Naledi for a logo',
    proves: 'A verified agent pays 2 RLUSD on its own, and the exchange accepts it because every check passes.',
    decidedBy: 'exchange',
  },
  {
    kind: 'scenario-3',
    title: 'Your agent tries to split a payment',
    proves: 'Splitting a payment into smaller parts does not get around the 5 RLUSD daily limit.',
    decidedBy: 'policy',
  },
  {
    kind: 'scenario-1',
    title: 'An unknown agent tries to pay',
    proves: 'An agent without a credential cannot pay the agent deposit address; the XRP Ledger rejects it.',
    decidedBy: 'ledger',
  },
  {
    kind: 'scenario-4',
    title: 'You revoke your agent',
    proves: 'The business revokes its agent, and from the next ledger, within seconds, its next payment is refused.',
    decidedBy: 'policy',
  },
];

export function scenarioLabel(scenario: Scenario): string {
  return scenario.title;
}

/** The tour story title for a scenario, used where a page points the reader to the tour. */
export function storyTitle(kind: ScenarioKind): string {
  const scenario = SCENARIOS.find((item) => item.kind === kind);
  if (scenario === undefined) throw new Error(`No story for ${kind}`);
  return scenario.title;
}
