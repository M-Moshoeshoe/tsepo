import type { Metadata } from 'next';
import Link from 'next/link';
import { Section } from '../components/display.tsx';
import { FlowDiagram } from '../components/overview/flow-diagram.tsx';
import { Term } from '../components/term.tsx';
import { Button } from '../components/ui/button.tsx';

export const metadata: Metadata = { title: 'Overview - Tšepo' };

const SCENARIOS = [
  {
    number: 1,
    title: 'Unknown agent',
    proves: (
      <>
        An agent without a credential cannot pay the agent lane: the ledger itself rejects it with{' '}
        <Term term="tecNO_PERMISSION">tecNO_PERMISSION</Term>.
      </>
    ),
  },
  {
    number: 2,
    title: 'Verified agent',
    proves: <>A registered agent pays 2 RLUSD on its own, and the exchange clears it because every check passes.</>,
  },
  {
    number: 3,
    title: 'Split payments',
    proves: <>Splitting a payment into smaller parts does not get around the 5 RLUSD daily limit.</>,
  },
  {
    number: 4,
    title: 'Revoke',
    proves: (
      <>
        The business revokes its agent at once; its next payment is refused, and a stale credential would fail with{' '}
        <Term term="tecBAD_CREDENTIALS">tecBAD_CREDENTIALS</Term>.
      </>
    ),
  },
];

export default function OverviewPage() {
  return (
    <div className="grid gap-8">
      <div className="grid max-w-3xl gap-5">
        <h1 className="text-2xl leading-snug font-semibold text-ink sm:text-3xl">
          Tšepo gives an AI agent that pays a verified identity and spending limits on the XRP Ledger, so its business stays
          in control and an exchange knows who is paying.
        </h1>
        <div>
          <Button asChild>
            <Link href="/registry">Start the demo</Link>
          </Button>
        </div>
      </div>

      <Section title="How a payment moves">
        <div className="grid gap-4">
          <FlowDiagram />
          <p className="max-w-3xl text-sm text-muted">
            The agent holds a <Term term="credential">credential</Term> that proves its mandate; only the mandate{' '}
            <Term term="fingerprint">fingerprint</Term> goes on the ledger. The exchange{' '}
            <Term term="agent-lane">agent lane</Term> accepts only credentialed agents, and the{' '}
            <Term term="travel-rule">Travel Rule</Term> package reaches the exchange before the money does.
          </p>
        </div>
      </Section>

      <section aria-labelledby="scenarios-heading" className="grid gap-3">
        <h2 id="scenarios-heading" className="text-lg font-semibold text-ink">
          What each scenario proves
        </h2>
        <ol className="grid divide-y divide-border rounded-md border border-border bg-surface">
          {SCENARIOS.map((scenario) => (
            <li key={scenario.number} className="grid gap-1 px-4 py-3 sm:grid-cols-[2rem_11rem_1fr] sm:gap-4">
              <span className="font-semibold text-primary tabular-nums">{scenario.number}</span>
              <span className="font-medium text-ink">{scenario.title}</span>
              <span className="text-sm text-ink sm:text-base">{scenario.proves}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
