import type { PayoutIntent } from '../agent/payout-parser.ts';
import type { PayoutRecord, RunRecord } from '../agent/records.ts';

export type StepState = 'done' | 'failed' | 'not-reached';

export interface PayoutStep {
  id: 'package' | 'cosign' | 'submit' | 'result';
  label: string;
  state: StepState;
  detail?: string | undefined;
  hash?: string | undefined;
}

export interface PayoutActivity {
  intent: PayoutIntent;
  outcome: 'paid' | 'refused' | 'failed' | 'in-progress' | 'not-started';
  reasons: string[];
  steps: PayoutStep[];
}

export interface RunActivity {
  startedAt: string;
  instruction: string;
  payouts: PayoutActivity[];
}

/** Turns the events of one payout into its four steps: package sent, co-signed, submitted, result. */
export function payoutSteps(events: readonly PayoutRecord[]): Omit<PayoutActivity, 'intent'> {
  const find = (status: PayoutRecord['status']): PayoutRecord | undefined => events.find((event) => event.status === status);
  const sent = find('package-sent');
  const signed = find('signed');
  const paid = find('paid');
  const refused = find('refused');
  const failed = find('failed');

  const steps: PayoutStep[] = [
    {
      id: 'package',
      label: 'Package sent',
      state: sent === undefined ? 'not-reached' : 'done',
      detail: sent?.invoiceId,
    },
    {
      id: 'cosign',
      label: 'Co-signed',
      state: refused !== undefined ? 'failed' : signed === undefined ? 'not-reached' : 'done',
    },
    { id: 'submit', label: 'Submitted', state: signed?.hash === undefined ? 'not-reached' : 'done', hash: signed?.hash },
    {
      id: 'result',
      label: 'Result',
      state: paid !== undefined ? 'done' : refused !== undefined || failed !== undefined ? 'failed' : 'not-reached',
      hash: paid?.hash ?? failed?.hash,
    },
  ];

  if (paid !== undefined) return { outcome: 'paid', reasons: [], steps };
  if (refused !== undefined) return { outcome: 'refused', reasons: refused.reasons, steps };
  if (failed !== undefined) return { outcome: 'failed', reasons: failed.reasons, steps };
  return { outcome: events.length === 0 ? 'not-started' : 'in-progress', reasons: [], steps };
}

/** The activity of one run: each payout read from the instruction, with the events recorded since the run began. */
export function runActivity(run: RunRecord, events: readonly PayoutRecord[]): RunActivity {
  const since = events.filter((event) => event.updatedAt >= run.startedAt);
  return {
    startedAt: run.startedAt,
    instruction: run.instruction,
    payouts: run.intents.map((intent) => ({
      intent,
      ...payoutSteps(since.filter((event) => event.reference === intent.reference)),
    })),
  };
}
