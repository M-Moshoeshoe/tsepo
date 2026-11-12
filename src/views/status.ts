import { AdminReason, AgentReason, DepositReason, PolicyReason } from '../domain/reasons.ts';

export type Tone = 'cleared' | 'held' | 'refused';

/** The groups the compliance desk filters by. */
export type Category = 'cleared' | 'held' | 'refused' | 'rejected';

export interface Status {
  tone: Tone;
  category: Category;
  /** The short chip shown in tables. */
  chip: string;
  /** The full sentence shown in the details panel. */
  label: string;
}

export const CATEGORY_CHIPS: Record<Category, string> = {
  cleared: 'Accepted',
  held: 'Held for review',
  refused: 'Announced, not sent',
  rejected: 'Rejected by the ledger',
};

function status(category: Category, label: string): Status {
  return { tone: category === 'rejected' ? 'refused' : category, category, chip: CATEGORY_CHIPS[category], label };
}

/** Every time is shown in South African Standard Time (UTC+2). */
const SAST_ZONE = 'Africa/Johannesburg';

/** "18:02 SAST" */
export function formatSastTime(iso: string): string {
  const time = new Intl.DateTimeFormat('en-GB', { timeZone: SAST_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(
    new Date(iso),
  );
  return `${time} SAST`;
}

/** "12 November 2026", the calendar day in South Africa. */
export function formatSastDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: SAST_ZONE, day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(iso),
  );
}

/** "12 November 2026, 18:02 SAST" */
export function formatSast(iso: string): string {
  return `${formatSastDate(iso)}, ${formatSastTime(iso)}`;
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
  if (deposit.status === 'Cleared') return status('cleared', 'Accepted');
  if (deposit.reasons.some((reason) => UNVERIFIED_SENDER.includes(reason))) {
    return status('held', 'Held for review: no verified sender for this payment');
  }
  return status('held', 'Held for review: the payment does not match its Travel Rule details');
}

/**
 * The status of an attempt the policy service refused. `revokedAt` is the
 * time the agent credential was deleted, when the refusal followed a revocation.
 */
export function refusalStatus(reasons: readonly string[], revokedAt?: string): Status {
  const has = (reason: string): boolean => reasons.includes(reason);
  if (has(PolicyReason.SplitPaymentPattern)) {
    return status('refused', 'Refused by the approval service: payments split to get around the daily limit');
  }
  if (has(PolicyReason.CredentialMissing) && revokedAt !== undefined) {
    return status('refused', `Refused: this agent was revoked at ${formatSastTime(revokedAt)}`);
  }
  return status('refused', `Refused by the approval service: ${firstReasonText(reasons)}`);
}

export const LEDGER_REJECTION_STATUS: Status = status('rejected', 'Rejected by the ledger: no verified agent credential');

const REASON_TEXT: Record<string, string> = {
  [PolicyReason.MalformedPayment]: 'the payment was not well formed',
  [PolicyReason.NotAPayment]: 'only payments can be approved',
  [PolicyReason.UnsupportedPaymentFeature]: 'partial payments, paths and SendMax are not allowed',
  [PolicyReason.MemosNotAllowed]: 'memos are not allowed on agent payments',
  [PolicyReason.ReferenceMissing]: 'the payment carries no Travel Rule reference',
  [PolicyReason.PurposeMissing]: 'no purpose was given',
  [PolicyReason.FeeTooHigh]: 'the network fee is above the cap',
  [PolicyReason.AgentNotRegistered]: 'this agent is not registered',
  [PolicyReason.CredentialMissing]: 'the agent holds no credential on the ledger',
  [PolicyReason.CredentialInvalid]: 'the agent credential does not prove the current spending rules',
  [PolicyReason.MandateExpired]: 'the spending rules have expired',
  [PolicyReason.WrongCurrency]: 'only RLUSD from the approved issuer is allowed',
  [PolicyReason.RecipientNotApproved]: 'the recipient is not approved',
  [PolicyReason.OverPerPaymentLimit]: 'the payment is over the per-payment limit',
  [PolicyReason.OverDailyLimit]: 'the payment would go over the daily limit',
  [PolicyReason.SplitPaymentPattern]: 'payments split to get around the daily limit',
  [PolicyReason.DuplicateReference]: 'the reference was already used for a different payment',
  [PolicyReason.ServiceError]: 'the approval service could not complete its checks',
  [DepositReason.PackageMissing]: 'no Travel Rule details were received for this payment',
  [DepositReason.PackageAfterPayment]: 'the Travel Rule details arrived after the payment',
  [DepositReason.SenderMismatch]: 'the sender is not the agent named in the Travel Rule details',
  [DepositReason.BeneficiaryMismatch]: 'the beneficiary does not match the Travel Rule details',
  [DepositReason.AmountMismatch]: 'the amount does not match the Travel Rule details',
  [DepositReason.MandateFingerprintMismatch]: 'the spending rules in the Travel Rule details do not match their fingerprint',
  [DepositReason.CredentialNotPresented]: 'the payment presented no credential',
  [DepositReason.CredentialNotFound]: 'the presented credential is not on the ledger',
  [DepositReason.CredentialMismatch]: 'the credential does not prove the spending rules in the Travel Rule details',
  [AdminReason.MalformedAction]: 'the change was not well formed',
  [AdminReason.BadSignature]: 'the business signature did not verify',
  [AdminReason.SignerNotPrincipal]: 'it was not signed by the business named in the spending rules',
  [AdminReason.PrincipalChangeNotAllowed]: 'spending rules cannot move to another business',
  [AdminReason.StaleAction]: 'a newer change was already applied',
  [AgentReason.AlreadyPaid]: 'it was already paid',
  [AgentReason.Unresolved]: 'an earlier attempt is not resolved yet',
  [AgentReason.PayeeUnknown]: 'the payee is not in the directory',
  [AgentReason.NoMandate]: 'the agent has no spending rules',
};

/** Ledger result codes such as tecPATH_PARTIAL. */
const LEDGER_RESULT = /^te[cfm][A-Z_]+$/;

/**
 * A plain sentence fragment for a reason code. Ledger result codes are named;
 * error details are never shown, because they belong in the server log.
 */
export function reasonText(reason: string): string {
  const known = REASON_TEXT[reason];
  if (known !== undefined) return known;
  if (LEDGER_RESULT.test(reason)) return `the XRP Ledger returned ${reason}`;
  if (reason.startsWith(`${AgentReason.Error}:`)) return 'an error stopped it; the details are in the server log';
  return reason;
}

function firstReasonText(reasons: readonly string[]): string {
  const first = reasons[0];
  return first === undefined ? 'no reason was recorded' : reasonText(first);
}
