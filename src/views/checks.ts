import { toUnits } from '../domain/amount.ts';
import type { Directive9Package } from '../domain/directive9.ts';
import { isApprovedRecipient } from '../domain/mandate.ts';
import { DepositReason, PolicyReason } from '../domain/reasons.ts';

export type CheckState = 'passed' | 'failed' | 'not-checked';

export interface Check {
  id: 'credential' | 'recipient' | 'limits' | 'package-first' | 'fingerprint';
  label: string;
  state: CheckState;
}

const LABELS: Record<Check['id'], string> = {
  credential: 'Credential valid',
  recipient: 'Recipient approved',
  limits: 'Within limits',
  'package-first': 'Package arrived first',
  fingerprint: 'Fingerprint matches',
};

function check(id: Check['id'], state: CheckState): Check {
  return { id, label: LABELS[id], state };
}

function passIf(ok: boolean): CheckState {
  return ok ? 'passed' : 'failed';
}

function withinPerPaymentLimit(amount: string | undefined, pkg: Directive9Package): boolean {
  if (amount === undefined) return false;
  try {
    return toUnits(amount) <= toUnits(pkg.agent.mandate.perPaymentLimit);
  } catch {
    return false;
  }
}

/** The check timeline for a payment that reached the agent lane. */
export function depositChecks(
  deposit: { reasons: readonly string[]; amount?: string | undefined },
  pkg: Directive9Package | undefined,
  laneAddress: string,
  destinationTag: number | undefined,
): Check[] {
  const has = (reason: string): boolean => deposit.reasons.includes(reason);
  if (pkg === undefined) {
    return [
      check('credential', 'not-checked'),
      check('recipient', 'not-checked'),
      check('limits', 'not-checked'),
      check('package-first', 'failed'),
      check('fingerprint', 'not-checked'),
    ];
  }
  return [
    check(
      'credential',
      passIf(
        ![
          DepositReason.CredentialNotPresented,
          DepositReason.CredentialNotFound,
          DepositReason.CredentialMismatch,
          DepositReason.SenderMismatch,
        ].some(has),
      ),
    ),
    check(
      'recipient',
      passIf(!has(DepositReason.BeneficiaryMismatch) && isApprovedRecipient(pkg.agent.mandate, laneAddress, destinationTag)),
    ),
    check('limits', passIf(!has(DepositReason.AmountMismatch) && withinPerPaymentLimit(deposit.amount, pkg))),
    check('package-first', passIf(!has(DepositReason.PackageAfterPayment))),
    check(
      'fingerprint',
      passIf(
        ![DepositReason.ReferenceMissing, DepositReason.MandateFingerprintMismatch, DepositReason.CredentialMismatch].some(
          has,
        ),
      ),
    ),
  ];
}

/** The check timeline for an attempt the policy service refused. Nothing reached the ledger. */
export function refusalChecks(reasons: readonly string[], packageReceived: boolean): Check[] {
  const has = (reason: string): boolean => reasons.includes(reason);
  const unknownAgent = has(PolicyReason.AgentNotRegistered);
  return [
    check(
      'credential',
      passIf(
        ![
          PolicyReason.AgentNotRegistered,
          PolicyReason.CredentialMissing,
          PolicyReason.CredentialInvalid,
          PolicyReason.MandateExpired,
        ].some(has),
      ),
    ),
    check('recipient', unknownAgent ? 'not-checked' : passIf(!has(PolicyReason.RecipientNotApproved))),
    check(
      'limits',
      unknownAgent
        ? 'not-checked'
        : passIf(![PolicyReason.OverPerPaymentLimit, PolicyReason.OverDailyLimit, PolicyReason.SplitPaymentPattern].some(has)),
    ),
    check('package-first', passIf(packageReceived)),
    check('fingerprint', 'not-checked'),
  ];
}

/** The check timeline for a payment the ledger itself rejected for lack of a credential. */
export function ledgerRejectionChecks(): Check[] {
  return [
    check('credential', 'failed'),
    check('recipient', 'not-checked'),
    check('limits', 'not-checked'),
    check('package-first', 'not-checked'),
    check('fingerprint', 'not-checked'),
  ];
}
