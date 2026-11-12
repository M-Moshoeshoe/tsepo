import type { PayoutActivity, PayoutStep, RunActivity } from '../../src/views/activity.ts';
import { formatSast, reasonText } from '../../src/views/status.ts';
import { Amount, AssistantMark, EmptyState, ExplorerLink } from '../display.tsx';
import { Timeline, type TimelineState } from '../timeline.tsx';
import { Badge, type BadgeTone } from '../ui/badge.tsx';

const OUTCOME: Record<PayoutActivity['outcome'], { tone: BadgeTone; label: string }> = {
  paid: { tone: 'cleared', label: 'Paid' },
  refused: { tone: 'refused', label: 'Refused' },
  failed: { tone: 'refused', label: 'Failed' },
  'in-progress': { tone: 'neutral', label: 'In progress' },
  'not-started': { tone: 'neutral', label: 'Not started' },
};

const STEP_STATE: Record<PayoutStep['state'], { state: TimelineState; text: string }> = {
  done: { state: 'passed', text: 'Done' },
  failed: { state: 'failed', text: 'Stopped here' },
  'not-reached': { state: 'pending', text: 'Not reached' },
};

function PayoutRow({ payout }: { payout: PayoutActivity }) {
  const outcome = OUTCOME[payout.outcome];
  return (
    <li className="grid gap-3 border-t border-border pt-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm text-ink">
          <span className="font-medium">{payout.intent.reference}</span>
          <span className="text-muted">, </span>
          <Amount value={payout.intent.amount} className="font-medium" /> to {payout.intent.payee}
          <span className="block text-muted">{payout.intent.purpose}</span>
        </p>
        <Badge tone={outcome.tone}>{outcome.label}</Badge>
      </div>
      <Timeline
        label={`Steps for ${payout.intent.reference}`}
        items={payout.steps.map((step) => ({
          id: step.id,
          label: step.label,
          state: STEP_STATE[step.state].state,
          stateText: STEP_STATE[step.state].text,
          detail:
            step.hash === undefined ? undefined : (
              <span>
                <ExplorerLink hash={step.hash}>Transaction</ExplorerLink>
              </span>
            ),
        }))}
      />
      {payout.reasons.length > 0 && <p className="text-sm text-refused">Reason: {payout.reasons.map(reasonText).join('; ')}.</p>}
    </li>
  );
}

export function AgentActivity({ activity }: { activity: RunActivity | undefined }) {
  return (
    <div className="grid gap-5">
      <p className="flex items-start gap-2 rounded-md border border-border px-3 py-2 text-sm text-ink">
        <AssistantMark />
        Claude only reads the instruction. The policy service decides limits and approvals, never the model.
      </p>
      {activity === undefined ? (
        <EmptyState title="The agent has not received an instruction yet">Run scenario 2 to see it read an instruction and pay.</EmptyState>
      ) : (
        <>
          <div className="grid gap-2">
            <p className="text-sm text-muted">Instruction from the business, received {formatSast(activity.startedAt)}</p>
            <p className="rounded-md border border-border bg-background px-3 py-2 text-sm whitespace-pre-wrap text-ink">
              {activity.instruction}
            </p>
          </div>
          <div className="grid gap-3">
            <p className="text-sm font-medium text-ink">Payments Claude read from the instruction</p>
            <ol className="grid gap-4">
              {activity.payouts.map((payout) => (
                <PayoutRow key={payout.intent.reference} payout={payout} />
              ))}
            </ol>
          </div>
        </>
      )}
    </div>
  );
}
