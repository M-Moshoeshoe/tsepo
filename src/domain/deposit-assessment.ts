import { RLUSD } from '../ledger/testnet.ts';
import { toUnits } from './amount.ts';
import { AGENT_MANDATE_CREDENTIAL_TYPE } from './credential-check.ts';
import type { Directive9Package } from './directive9.ts';
import { mandateFingerprint } from './fingerprint.ts';
import type { IssuedAmount } from './payment-facts.ts';
import { DepositReason } from './reasons.ts';

/** A validated, successful payment into the agent lane. */
export interface IncomingPayment {
  hash: string;
  ledgerIndex: number;
  sender: string;
  destinationTag: number | undefined;
  invoiceId: string | undefined;
  delivered: IssuedAmount | undefined;
  credentialIds: string[];
}

export interface ReceivedPackage {
  package: Directive9Package;
  /** The latest validated ledger when the package arrived. */
  receivedLedgerIndex: number;
}

/** The credential named in the payment, as read from the ledger. */
export interface PresentedCredential {
  issuer: string;
  subject: string;
  credentialType: string;
  uri?: string | undefined;
}

export interface DepositContext {
  payment: IncomingPayment;
  received: ReceivedPackage | undefined;
  credential: PresentedCredential | undefined;
  laneAddress: string;
  issuerAddress: string;
}

export type DepositAssessment = { status: 'Cleared' } | { status: 'Held'; reasons: DepositReason[] };

function sameAmount(delivered: IssuedAmount | undefined, expected: string): boolean {
  if (delivered?.currency !== RLUSD.currency || delivered.issuer !== RLUSD.issuer) return false;
  try {
    return toUnits(delivered.value) === toUnits(expected);
  } catch {
    return false;
  }
}

/**
 * Decides whether a deposit clears. A deposit clears only when its travel
 * package arrived in an earlier ledger, every detail matches the payment,
 * and the credential it presented proves the mandate in the package.
 */
export function assessDeposit(context: DepositContext): DepositAssessment {
  const { payment, received, credential } = context;
  const reasons = new Set<DepositReason>();

  if (payment.invoiceId === undefined) reasons.add(DepositReason.ReferenceMissing);

  if (received === undefined) {
    reasons.add(DepositReason.PackageMissing);
  } else {
    const pkg = received.package;
    if (received.receivedLedgerIndex >= payment.ledgerIndex) reasons.add(DepositReason.PackageAfterPayment);
    if (pkg.originator.ledgerAddress !== payment.sender || pkg.agent.ledgerAddress !== payment.sender) {
      reasons.add(DepositReason.SenderMismatch);
    }
    if (
      pkg.beneficiary.ledgerAddress !== context.laneAddress ||
      pkg.beneficiary.destinationTag !== payment.destinationTag
    ) {
      reasons.add(DepositReason.BeneficiaryMismatch);
    }
    if (!sameAmount(payment.delivered, pkg.transfer.amount)) reasons.add(DepositReason.AmountMismatch);
    if (mandateFingerprint(pkg.agent.mandate) !== pkg.agent.mandateFingerprint) {
      reasons.add(DepositReason.MandateFingerprintMismatch);
    }

    if (payment.credentialIds.length === 0) {
      reasons.add(DepositReason.CredentialNotPresented);
    } else if (credential === undefined) {
      reasons.add(DepositReason.CredentialNotFound);
    } else if (
      credential.issuer !== context.issuerAddress ||
      credential.issuer !== pkg.agent.credentialIssuer ||
      credential.subject !== payment.sender ||
      credential.credentialType !== AGENT_MANDATE_CREDENTIAL_TYPE ||
      credential.uri !== pkg.agent.mandateFingerprint
    ) {
      reasons.add(DepositReason.CredentialMismatch);
    }
  }

  return reasons.size === 0 ? { status: 'Cleared' } : { status: 'Held', reasons: [...reasons] };
}
