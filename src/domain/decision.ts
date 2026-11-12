import { RLUSD } from '../ledger/testnet.ts';
import { toUnits } from './amount.ts';
import type { CredentialCheck } from './credential-check.ts';
import { isApprovedRecipient, type Mandate } from './mandate.ts';
import type { PaymentFacts } from './payment-facts.ts';
import { PolicyReason } from './reasons.ts';

/** The most a co-signed payment may pay in fees: 0.001 XRP. */
export const MAX_FEE_DROPS = 1000n;

const INVOICE_ID_PATTERN = /^[0-9A-F]{64}$/;

/** A payment the policy service has already co-signed today. */
export interface Approval {
  destination: string;
  destinationTag?: number | undefined;
  amount: string;
}

export interface ReviewContext {
  facts: PaymentFacts;
  /** Free text from the agent. Untrusted: it is only checked for presence. */
  purpose: string;
  mandate: Mandate | undefined;
  /** The result of reading the credential on the ledger; undefined when there is none. */
  credential: CredentialCheck | undefined;
  approvalsToday: Approval[];
  now: Date;
}

export type Decision = { approve: true } | { approve: false; reasons: PolicyReason[] };

function sumUnits(approvals: Approval[]): bigint {
  return approvals.reduce((total, approval) => total + toUnits(approval.amount), 0n);
}

function amountUnits(facts: PaymentFacts): bigint | undefined {
  if (facts.amount === undefined) return undefined;
  try {
    return toUnits(facts.amount.value);
  } catch {
    return undefined;
  }
}

/**
 * Decides whether the policy service co-signs a payment. Every rule is
 * checked and every failing rule is reported. Nothing in the purpose text
 * or a memo can change the outcome.
 */
export function decide(context: ReviewContext): Decision {
  const { facts, mandate } = context;
  const reasons = new Set<PolicyReason>();

  if (facts.transactionType !== 'Payment') reasons.add(PolicyReason.NotAPayment);
  if (facts.usesUnsupportedFeature) reasons.add(PolicyReason.UnsupportedPaymentFeature);
  if (facts.hasMemos) reasons.add(PolicyReason.MemosNotAllowed);
  if (facts.invoiceId === undefined || !INVOICE_ID_PATTERN.test(facts.invoiceId)) {
    reasons.add(PolicyReason.ReferenceMissing);
  }
  if (context.purpose.trim() === '') reasons.add(PolicyReason.PurposeMissing);
  if (facts.feeDrops > MAX_FEE_DROPS) reasons.add(PolicyReason.FeeTooHigh);

  if (mandate?.agent !== facts.account) {
    reasons.add(PolicyReason.AgentNotRegistered);
    return { approve: false, reasons: [...reasons] };
  }

  if (context.credential === undefined) reasons.add(PolicyReason.CredentialMissing);
  else if (!context.credential.valid) reasons.add(PolicyReason.CredentialInvalid);
  if (Date.parse(mandate.expiresAt) <= context.now.getTime()) reasons.add(PolicyReason.MandateExpired);
  if (!isApprovedRecipient(mandate, facts.destination, facts.destinationTag)) {
    reasons.add(PolicyReason.RecipientNotApproved);
  }

  const units = amountUnits(facts);
  const isRlusd = facts.amount?.currency === RLUSD.currency && facts.amount.issuer === RLUSD.issuer;
  if (!isRlusd) reasons.add(PolicyReason.WrongCurrency);
  if (units === undefined || units <= 0n) {
    reasons.add(PolicyReason.MalformedPayment);
  } else {
    if (units > toUnits(mandate.perPaymentLimit)) reasons.add(PolicyReason.OverPerPaymentLimit);
    if (sumUnits(context.approvalsToday) + units > toUnits(mandate.dailyLimit)) {
      reasons.add(PolicyReason.OverDailyLimit);
      const sameBeneficiary = context.approvalsToday.some(
        (approval) => approval.destination === facts.destination && approval.destinationTag === facts.destinationTag,
      );
      if (sameBeneficiary) reasons.add(PolicyReason.SplitPaymentPattern);
    }
  }

  return reasons.size === 0 ? { approve: true } : { approve: false, reasons: [...reasons] };
}
