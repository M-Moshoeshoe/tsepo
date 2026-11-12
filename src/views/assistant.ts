import type { PayoutIntent } from '../agent/payout-parser.ts';
import { PolicyReason } from '../domain/reasons.ts';
import type { BusinessPayment } from './payments.ts';
import { reasonText } from './status.ts';

/**
 * Thuso's words. Thuso is the AI step of the agent: it reads instructions. Its
 * notes are fixed templates filled only with recorded facts, so it can never
 * say something the records do not show, and it never speaks for a decision:
 * rules decide, and Thuso only relays what they decided.
 */
export const ASSISTANT_NAME = 'Thuso';

function amountList(intents: readonly PayoutIntent[]): string {
  const parts = intents.map((intent) => `${intent.amount} RLUSD to ${intent.payee}`);
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} and ${parts.at(-1) ?? ''}`;
}

/** "I read this instruction and found 3 payments to Thabo Nkosi, 2 RLUSD each. I asked the approval service to approve each one." */
export function readNote(intents: readonly PayoutIntent[]): string {
  const count = intents.length;
  if (count === 0) return 'I read this instruction and found no payments in it, so I paid nothing.';
  const first = intents[0];
  if (count === 1 && first !== undefined) {
    return `I read this instruction and found 1 payment: ${first.amount} RLUSD to ${first.payee}. I asked the approval service to approve it.`;
  }
  const payees = new Set(intents.map((intent) => intent.payee));
  const amounts = new Set(intents.map((intent) => intent.amount));
  const [payee] = payees;
  const [amount] = amounts;
  const found =
    payees.size === 1 && amounts.size === 1 && payee !== undefined && amount !== undefined
      ? `${String(count)} payments to ${payee}, ${amount} RLUSD each`
      : `${String(count)} payments: ${amountList(intents)}`;
  return `I read this instruction and found ${found}. I asked the approval service to approve each one.`;
}

function firstReason(reasons: readonly string[]): string {
  const first = reasons[0];
  return first === undefined ? 'no reason was recorded' : reasonText(first);
}

/** What Thuso says about one payment's outcome, or nothing while it is still going. */
export function outcomeNote(payment: Pick<BusinessPayment, 'status' | 'reasons' | 'intent'>): string | undefined {
  const ref = payment.intent.reference;
  const why = firstReason(payment.reasons);
  switch (payment.status) {
    case 'paid':
      return `${ref} is paid. The approval service approved it and the XRP Ledger settled it.`;
    case 'not-approved':
      if (payment.reasons.includes(PolicyReason.CredentialMissing)) {
        return `My credential is no longer on the ledger, so the approval service refused ${ref}. I can no longer pay anyone.`;
      }
      return `The approval service did not approve ${ref}: ${why}. I cannot change that; only your business can change the spending rules.`;
    case 'failed':
      return `${ref} did not complete: ${why}. Nothing further was sent.`;
    case 'in-progress':
    case 'not-started':
      return undefined;
  }
}

/** Thuso's one line for an inbox row: "Found 3 payments to Thabo Nkosi, 2 RLUSD each." */
export function readSummary(intents: readonly PayoutIntent[]): string {
  const first = intents[0];
  if (first === undefined) return 'Found no payments.';
  if (intents.length === 1) return `Found 1 payment: ${first.amount} RLUSD to ${first.payee}.`;
  const payees = new Set(intents.map((intent) => intent.payee));
  const amounts = new Set(intents.map((intent) => intent.amount));
  if (payees.size === 1 && amounts.size === 1) return `Found ${String(intents.length)} payments to ${first.payee}, ${first.amount} RLUSD each.`;
  return `Found ${String(intents.length)} payments: ${amountList(intents)}.`;
}
