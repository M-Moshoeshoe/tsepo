import type { PayoutActivity, PayoutStep, RunActivity } from '../../src/views/activity.ts';
import { formatSast, reasonText } from '../../src/views/status.ts';
import { CopyButton } from '../copy-button.tsx';
import { Amount, AssistantMark, EmptyMessage, ExplorerLink, StatusBadge } from '../display.tsx';
import { Timeline, type TimelineState } from '../timeline.tsx';

const OUTCOME: Record<PayoutActivity['outcome'], { tone: 'cleared' | 'refused' | 'neutral'; label: string }> = {
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
    <li className="grid gap-3 rounded-xl bg-secondary p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-sm text-primary">
          <span className="font-semibold">{payout.intent.reference}</span>
          <span className="text-tertiary">, </span>
          <Amount value={payout.intent.amount} className="font-semibold" /> to {payout.intent.payee}
          <span className="block text-tertiary">{payout.intent.purpose}</span>
        </p>
        <StatusBadge tone={outcome.tone}>{outcome.label}</StatusBadge>
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
              <span className="flex flex-wrap items-center gap-2">
                <ExplorerLink hash={step.hash}>Transaction</ExplorerLink>
                <CopyButton value={step.hash} label="transaction hash" />
              </span>
            ),
        }))}
      />
      {payout.reasons.length > 0 && <p className="text-sm text-error-primary">Reason: {payout.reasons.map(reasonText).join('; ')}.</p>}
    </li>
  );
}

/** The latest instruction the agent received, and each payment Claude read from it, as a timeline. */
export function AgentActivity({ activity }: { activity: RunActivity | undefined }) {
  return (
    <div className="grid gap-5">
      <p className="flex items-start gap-2 text-sm text-tertiary">
        <AssistantMark />
        Claude only reads the instruction. The policy service decides limits and approvals, never the model.
      </p>
      {activity === undefined ? (
        <EmptyMessage title="No payments yet.">Run scenario 2 to see a cleared payment.</EmptyMessage>
      ) : (
        <>
          <div className="grid gap-2">
            <p className="text-sm text-tertiary">Instruction from the business, received {formatSast(activity.startedAt)}</p>
            <p className="rounded-lg bg-secondary px-3 py-2.5 text-sm whitespace-pre-wrap text-primary">{activity.instruction}</p>
          </div>
          <div className="grid gap-3">
            <p className="text-sm font-semibold text-primary">Payments Claude read from the instruction</p>
            <ol className="grid gap-3">
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
