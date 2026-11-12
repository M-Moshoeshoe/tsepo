import { DepositReason, PolicyReason } from '../domain/reasons.ts';

export type Tone = 'cleared' | 'held' | 'refused';

export interface Status {
  tone: Tone;
  label: string;
}

/** "12 November 2026 at 15:11 UTC". Always UTC, so every viewer sees the same time. */
export function formatUtc(iso: string): string {
  const formatted = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(new Date(iso));
  return `${formatted} UTC`;
}

const UNVERIFIED_SENDER: readonly string[] = [
  DepositReason.ReferenceMissing,
  DepositReason.PackageMissing,
  DepositReason.SenderMismatch,
  DepositReason.CredentialNotPresented,
  DepositReason.CredentialNotFound,
  DepositReason.CredentialMismatch,
];

export function depositStatus(deposit: { status: 'Cleared' | 'Held'; reasons: readonly string[] }): Status {
  if (deposit.status === 'Cleared') return { tone: 'cleared', label: 'Cleared' };
  if (deposit.reasons.some((reason) => UNVERIFIED_SENDER.includes(reason))) {
    return { tone: 'held', label: 'Held: no verified sender for this payment' };
  }
  return { tone: 'held', label: 'Held: the payment does not match its travel package' };
}

/**
 * The status of an attempt the policy service refused. `revokedAt` is the
 * time the agent credential was deleted, when the refusal followed a revocation.
 */
export function refusalStatus(reasons: readonly string[], revokedAt?: string): Status {
  const has = (reason: string): boolean => reasons.includes(reason);
  if (has(PolicyReason.SplitPaymentPattern)) {
    return { tone: 'refused', label: 'Refused by the policy service: payments split to get around the daily limit' };
  }
  if (has(PolicyReason.CredentialMissing) && revokedAt !== undefined) {
    return { tone: 'refused', label: `Refused: this agent's mandate was revoked at ${formatUtc(revokedAt)}` };
  }
  return { tone: 'refused', label: `Refused by the policy service: ${firstReasonText(reasons)}` };
}

export const LEDGER_REJECTION_STATUS: Status = {
  tone: 'refused',
  label: 'Rejected by the ledger: no verified agent credential',
};

const REASON_TEXT: Record<string, string> = {
  [PolicyReason.MalformedPayment]: 'the payment was not well formed',
  [PolicyReason.NotAPayment]: 'only payments can be co-signed',
  [PolicyReason.UnsupportedPaymentFeature]: 'partial payments, paths and SendMax are not allowed',
  [PolicyReason.MemosNotAllowed]: 'memos are not allowed on agent payments',
  [PolicyReason.ReferenceMissing]: 'the payment carries no travel package reference',
  [PolicyReason.PurposeMissing]: 'no purpose was given',
  [PolicyReason.FeeTooHigh]: 'the network fee is above the cap',
  [PolicyReason.AgentNotRegistered]: 'this agent is not registered',
  [PolicyReason.CredentialMissing]: 'the agent holds no credential on the ledger',
  [PolicyReason.CredentialInvalid]: 'the agent credential does not prove the current mandate',
  [PolicyReason.MandateExpired]: 'the mandate has expired',
  [PolicyReason.WrongCurrency]: 'only RLUSD from the approved issuer is allowed',
  [PolicyReason.RecipientNotApproved]: 'the recipient is not approved',
  [PolicyReason.OverPerPaymentLimit]: 'the payment is over the per-payment limit',
  [PolicyReason.OverDailyLimit]: 'the payment would go over the daily limit',
  [PolicyReason.SplitPaymentPattern]: 'payments split to get around the daily limit',
  [PolicyReason.DuplicateReference]: 'the reference was already used for a different payment',
  [PolicyReason.ServiceError]: 'the policy service could not complete its checks',
  [DepositReason.PackageMissing]: 'no travel package was received for this payment',
  [DepositReason.PackageAfterPayment]: 'the travel package arrived after the payment',
  [DepositReason.SenderMismatch]: 'the sender is not the agent named in the package',
  [DepositReason.BeneficiaryMismatch]: 'the beneficiary does not match the package',
  [DepositReason.AmountMismatch]: 'the amount does not match the package',
  [DepositReason.MandateFingerprintMismatch]: 'the mandate in the package does not match its fingerprint',
  [DepositReason.CredentialNotPresented]: 'the payment presented no credential',
  [DepositReason.CredentialNotFound]: 'the presented credential is not on the ledger',
  [DepositReason.CredentialMismatch]: 'the credential does not prove the mandate in the package',
};

/** A plain sentence fragment for a reason code. Unknown codes are shown as they are. */
export function reasonText(reason: string): string {
  return REASON_TEXT[reason] ?? reason;
}

function firstReasonText(reasons: readonly string[]): string {
  const first = reasons[0];
  return first === undefined ? 'no reason was recorded' : reasonText(first);
}
