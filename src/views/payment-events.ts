import type { Actor } from '../demo/events.ts';
import type { Check } from './checks.ts';
import type { Status } from './status.ts';

export type EventState = 'done' | 'failed' | 'not-reached';

export interface PaymentEvent {
  id: 'package' | 'credential' | 'cosign' | 'settled' | 'outcome';
  label: string;
  state: EventState;
  /** When it happened, as an ISO time, if known. */
  at?: string | undefined;
  /** A plain detail, such as the exact status sentence for the outcome. */
  detail?: string | undefined;
}

export interface PaymentEventInput {
  kind: 'deposit' | 'refusal' | 'rejection';
  at: string;
  status: Status;
  checks: Check[];
  packageReceivedAt: string | undefined;
}

function checkState(checks: Check[], id: Check['id']): EventState {
  const state = checks.find((check) => check.id === id)?.state;
  if (state === 'passed') return 'done';
  if (state === 'failed') return 'failed';
  return 'not-reached';
}

/**
 * The story of one payment for the slideout, in order: package received,
 * credential checked, co-signed, settled, and the outcome in the exact
 * status words. Steps that never happened are marked not reached.
 */
export function paymentEvents(input: PaymentEventInput): PaymentEvent[] {
  const packageEvent: PaymentEvent = {
    id: 'package',
    label: 'Travel package received',
    state: input.packageReceivedAt === undefined ? (input.kind === 'rejection' ? 'not-reached' : 'failed') : 'done',
    at: input.packageReceivedAt,
  };
  const credential: PaymentEvent = { id: 'credential', label: 'Credential checked', state: checkState(input.checks, 'credential') };
  const outcome: PaymentEvent = {
    id: 'outcome',
    label: input.status.chip,
    state: input.status.tone === 'cleared' ? 'done' : 'failed',
    at: input.at,
    detail: input.status.label,
  };

  switch (input.kind) {
    case 'deposit':
      return [
        packageEvent,
        credential,
        { id: 'cosign', label: 'Co-signed by the policy service', state: 'done' },
        { id: 'settled', label: 'Settled on the XRP Ledger', state: 'done', at: input.at },
        outcome,
      ];
    case 'refusal':
      return [
        packageEvent,
        credential,
        { id: 'cosign', label: 'Co-signed by the policy service', state: 'failed', at: input.at, detail: input.status.label },
        { id: 'settled', label: 'Settled on the XRP Ledger', state: 'not-reached' },
      ];
    case 'rejection':
      return [
        packageEvent,
        { ...credential, label: 'Credential checked by the ledger', state: 'failed' },
        { id: 'settled', label: 'Settled on the XRP Ledger', state: 'failed', at: input.at, detail: input.status.label },
      ];
  }
}

/** Who cleared or stopped a desk entry. */
export function decidedBy(kind: PaymentEventInput['kind']): Actor {
  if (kind === 'deposit') return 'exchange';
  if (kind === 'refusal') return 'policy';
  return 'ledger';
}
