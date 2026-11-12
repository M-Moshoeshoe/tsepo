import { ChevronDown } from '@untitledui/icons';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SectionTitle, StatusBadge } from '../components/display.tsx';
import { ActivityFeed } from '../components/home/activity-feed.tsx';
import { Runbook } from '../components/home/runbook.tsx';
import { FlowDiagram } from '../components/overview/flow-diagram.tsx';
import { Term } from '../components/term.tsx';
import { formatSast } from '../src/views/status.ts';
import { loadHome, type HomeView } from './_data/home.ts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Home - Tšepo' };

function Metric({ label, value, note }: { label: string; value: ReactNode; note: ReactNode }) {
  return (
    <div className="grid content-start gap-2 rounded-xl bg-secondary p-5">
      <dt className="text-sm text-tertiary">{label}</dt>
      <dd className="grid gap-1">
        <span className="text-display-xs font-semibold text-primary tabular-nums">{value}</span>
        <span className="text-sm text-tertiary">{note}</span>
      </dd>
    </div>
  );
}

const AGENT_STATUS: Record<HomeView['agentStatus']['state'], { tone: 'cleared' | 'held' | 'refused' | 'neutral'; text: string }> = {
  active: { tone: 'cleared', text: 'Active' },
  revoked: { tone: 'refused', text: 'Revoked' },
  mismatch: { tone: 'held', text: 'Credential does not match' },
  'not-registered': { tone: 'neutral', text: 'Not registered' },
};

function Metrics({ view }: { view: HomeView }) {
  const status = AGENT_STATUS[view.agentStatus.state];
  const since = view.lastResetAt === undefined ? 'since the start' : `since the reset at ${formatSast(view.lastResetAt)}`;
  return (
    <dl className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Metric
        label="Agent status"
        value={
          <StatusBadge tone={status.tone} size="md">
            {status.text}
          </StatusBadge>
        }
        note={view.agentName}
      />
      <Metric
        label="Used today (SAST)"
        value={view.usage === undefined ? 'None' : `${view.usage.used} RLUSD`}
        note={view.usage === undefined ? 'No mandate is set.' : `of ${view.usage.limit} RLUSD, ${view.usage.left} left`}
      />
      <Metric label="Cleared since reset" value={view.clearedSinceReset} note={`Payments ${since}`} />
      <Metric
        label="Refused since reset"
        value={view.refusedSinceReset.total}
        note={`${String(view.refusedSinceReset.byPolicy)} by the policy service, ${String(view.refusedSinceReset.byLedger)} by the ledger`}
      />
    </dl>
  );
}

function HowItWorks() {
  return (
    <details className="group rounded-xl bg-secondary">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-xl px-5 py-4 outline-focus-ring focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
        <span className="text-lg font-semibold text-primary">How it works</span>
        <ChevronDown className="size-5 text-fg-quaternary transition-transform group-open:rotate-180" aria-hidden />
      </summary>
      <div className="grid gap-4 px-5 pb-5">
        <p className="max-w-3xl text-sm text-tertiary">
          Tšepo gives an AI agent that pays a verified identity and spending limits on the XRP Ledger, so its business stays in
          control and an exchange knows who is paying.
        </p>
        <div className="rounded-lg bg-primary p-4">
          <FlowDiagram />
        </div>
        <p className="max-w-3xl text-sm text-tertiary">
          The agent holds a <Term term="credential">credential</Term> that proves its mandate; only the mandate{' '}
          <Term term="fingerprint">fingerprint</Term> goes on the ledger. The exchange <Term term="agent-lane">agent lane</Term>{' '}
          accepts only credentialed agents, and the <Term term="travel-rule">Travel Rule</Term> package reaches the exchange
          before the money does.
        </p>
      </div>
    </details>
  );
}

export default async function HomePage() {
  const view = await loadHome();
  return (
    <div className="grid gap-10">
      <Metrics view={view} />
      <div className="grid items-start gap-10 2xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <section aria-labelledby="runbook-title" className="grid min-w-0 gap-4">
          <SectionTitle id="runbook-title" title="Demo runbook" />
          <p className="-mt-2 text-sm text-tertiary">Run the scenarios in order. Reset first to start from a clean state.</p>
          <div className="overflow-hidden rounded-xl ring-1 ring-secondary">
            <Runbook lastResults={view.lastResults} />
          </div>
        </section>
        <section aria-labelledby="recent-title" className="grid min-w-0 gap-4">
          <SectionTitle id="recent-title" title="Recent activity" />
          <ActivityFeed entries={view.recent} />
        </section>
      </div>
      <HowItWorks />
    </div>
  );
}
