import { CheckCircle2, CircleDashed, XCircle } from 'lucide-react';
import type { PayoutActivity, PayoutStep, RunActivity } from '../../src/views/activity.ts';
import { formatUtc, reasonText } from '../../src/views/status.ts';
import { Amount, AssistantMark, EmptyState, ExplorerLink } from '../display.tsx';
import { Badge, type BadgeTone } from '../ui/badge.tsx';
import { cn } from '../ui/cn.ts';

const OUTCOME: Record<PayoutActivity['outcome'], { tone: BadgeTone; label: string }> = {
  paid: { tone: 'cleared', label: 'Paid' },
  refused: { tone: 'refused', label: 'Refused' },
  failed: { tone: 'refused', label: 'Failed' },
  'in-progress': { tone: 'neutral', label: 'In progress' },
  'not-started': { tone: 'neutral', label: 'Not started' },
};

function StepIcon({ state }: { state: PayoutStep['state'] }) {
  if (state === 'done') return <CheckCircle2 className="size-4 text-cleared" aria-hidden />;
  if (state === 'failed') return <XCircle className="size-4 text-refused" aria-hidden />;
  return <CircleDashed className="size-4 text-muted" aria-hidden />;
}

const STATE_TEXT: Record<PayoutStep['state'], string> = { done: 'Done', failed: 'Stopped here', 'not-reached': 'Not reached' };

function PayoutRow({ payout }: { payout: PayoutActivity }) {
  const outcome = OUTCOME[payout.outcome];
  return (
    <li className="grid gap-3 border-t border-border py-4 first:border-t-0 first:pt-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm text-ink">
          <span className="font-medium">{payout.intent.reference}</span>
          <span className="text-muted">, </span>
          <Amount value={payout.intent.amount} className="font-medium" /> to {payout.intent.payee}
          <span className="block text-muted">{payout.intent.purpose}</span>
        </p>
        <Badge tone={outcome.tone}>{outcome.label}</Badge>
      </div>
      <ol className="grid gap-2 sm:grid-cols-4" aria-label={`Steps for ${payout.intent.reference}`}>
        {payout.steps.map((step) => (
          <li key={step.id} className={cn('rounded-md border border-border px-3 py-2', step.state === 'not-reached' && 'bg-background')}>
            <p className="flex items-center gap-2 text-sm font-medium text-ink">
              <StepIcon state={step.state} />
              {step.label}
            </p>
            <p className="mt-0.5 text-xs text-muted">{STATE_TEXT[step.state]}</p>
            {step.hash !== undefined && (
              <p className="mt-1">
                <ExplorerLink hash={step.hash}>Transaction</ExplorerLink>
              </p>
            )}
          </li>
        ))}
      </ol>
      {payout.reasons.length > 0 && (
        <p className="text-sm text-refused">Reason: {payout.reasons.map(reasonText).join('; ')}.</p>
      )}
    </li>
  );
}

export function AgentActivity({ activity }: { activity: RunActivity | undefined }) {
  if (activity === undefined) {
    return (
      <EmptyState title="The agent has not received an instruction yet">
        Run scenario 2 to see it read an instruction and pay.
      </EmptyState>
    );
  }
  return (
    <div className="grid gap-5">
      <div className="grid gap-2">
        <p className="text-sm text-muted">Instruction from the business, received {formatUtc(activity.startedAt)}</p>
        <p className="rounded-md border border-border bg-background px-3 py-2 text-sm whitespace-pre-wrap text-ink">
          {activity.instruction}
        </p>
      </div>
      <div className="grid gap-3">
        <p className="flex items-center gap-2 text-sm font-medium text-ink">
          <AssistantMark />
          Payments Claude read from the instruction
        </p>
        <ol className="grid">
          {activity.payouts.map((payout) => (
            <PayoutRow key={payout.intent.reference} payout={payout} />
          ))}
        </ol>
        <p className="text-xs text-muted">
          Claude only reads the instruction. The policy service decides limits and approvals, never the model.
        </p>
      </div>
    </div>
  );
}
