import { DepositReason } from '../domain/reasons.ts';

/**
 * When the Travel Rule details reached the exchange, relative to the payment.
 * Judged by ledger order (the exchange records the ledger it received them in),
 * not by clock seconds, because ledger close times are rounded.
 */
export type TravelRuleTiming = 'before' | 'after' | 'missing' | 'no-payment';

export const TRAVEL_RULE_LABELS: Record<TravelRuleTiming, string> = {
  before: 'Received before the payment',
  after: 'Received after the payment',
  missing: 'Not received',
  'no-payment': 'Received; no payment followed',
};

export const TRAVEL_RULE_TONES: Record<TravelRuleTiming, 'cleared' | 'held' | 'refused' | 'neutral'> = {
  before: 'cleared',
  after: 'held',
  missing: 'refused',
  'no-payment': 'neutral',
};

export function travelRuleTiming(kind: 'deposit' | 'refusal' | 'rejection', reasons: readonly string[], packageReceived: boolean): TravelRuleTiming {
  switch (kind) {
    case 'deposit':
      if (!packageReceived || reasons.includes(DepositReason.PackageMissing) || reasons.includes(DepositReason.ReferenceMissing)) return 'missing';
      return reasons.includes(DepositReason.PackageAfterPayment) ? 'after' : 'before';
    case 'refusal':
      return packageReceived ? 'no-payment' : 'missing';
    case 'rejection':
      return 'missing';
  }
}
