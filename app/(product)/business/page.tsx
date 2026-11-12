import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SectionTitle, StatusBadge } from '../../../components/display.tsx';
import { ActivityFeed } from '../../../components/home/activity-feed.tsx';
import { formatSast } from '../../../src/views/status.ts';
import { loadHome, type HomeView } from '../../_data/home.ts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Overview, Lesedi Design Studio - Tšepo' };

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
  const since =
    view.lastResetAt === undefined ? 'since the start' : `since the sample data was restored at ${formatSast(view.lastResetAt)}`;
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
        label="Counted toward today's limit"
        value={view.usage === undefined ? 'None' : `${view.usage.used} RLUSD`}
        note={view.usage === undefined ? 'The agent has no spending rules.' : `of ${view.usage.limit} RLUSD, ${view.usage.left} left`}
      />
      <Metric label="Accepted payments" value={view.clearedSinceReset} note={`Payments ${since}`} />
      <Metric label="Stopped attempts" value={view.stoppedSinceReset.attempts} note={view.stoppedSinceReset.sentence} />
    </dl>
  );
}

/** The Business Overview: the agent's state today and its latest payments. */
export default async function OverviewPage() {
  const view = await loadHome();
  return (
    <div className="grid gap-10">
      <Metrics view={view} />
      <section aria-labelledby="recent-title" className="grid max-w-3xl min-w-0 gap-4">
        <SectionTitle id="recent-title" title="Recent activity" />
        <ActivityFeed entries={view.recent} />
      </section>
    </div>
  );
}
