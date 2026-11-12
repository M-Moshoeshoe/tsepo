/** Why the policy service refused to co-sign a payment. */
export const PolicyReason = {
  MalformedPayment: 'MALFORMED_PAYMENT',
  NotAPayment: 'NOT_A_PAYMENT',
  UnsupportedPaymentFeature: 'UNSUPPORTED_PAYMENT_FEATURE',
  MemosNotAllowed: 'MEMOS_NOT_ALLOWED',
  ReferenceMissing: 'REFERENCE_MISSING',
  PurposeMissing: 'PURPOSE_MISSING',
  FeeTooHigh: 'FEE_TOO_HIGH',
  AgentNotRegistered: 'AGENT_NOT_REGISTERED',
  CredentialMissing: 'CREDENTIAL_MISSING',
  CredentialInvalid: 'CREDENTIAL_INVALID',
  MandateExpired: 'MANDATE_EXPIRED',
  WrongCurrency: 'WRONG_CURRENCY',
  RecipientNotApproved: 'RECIPIENT_NOT_APPROVED',
  OverPerPaymentLimit: 'OVER_PER_PAYMENT_LIMIT',
  OverDailyLimit: 'OVER_DAILY_LIMIT',
  SplitPaymentPattern: 'SPLIT_PAYMENT_PATTERN',
  DuplicateReference: 'DUPLICATE_REFERENCE',
  /** Any error while reviewing. The payment is refused, never signed. */
  ServiceError: 'SERVICE_ERROR',
} as const;

export type PolicyReason = (typeof PolicyReason)[keyof typeof PolicyReason];

/** Why the exchange held a deposit instead of clearing it. */
export const DepositReason = {
  ReferenceMissing: 'REFERENCE_MISSING',
  PackageMissing: 'PACKAGE_MISSING',
  PackageAfterPayment: 'PACKAGE_AFTER_PAYMENT',
  SenderMismatch: 'SENDER_MISMATCH',
  BeneficiaryMismatch: 'BENEFICIARY_MISMATCH',
  AmountMismatch: 'AMOUNT_MISMATCH',
  MandateFingerprintMismatch: 'MANDATE_FINGERPRINT_MISMATCH',
  CredentialNotPresented: 'CREDENTIAL_NOT_PRESENTED',
  CredentialNotFound: 'CREDENTIAL_NOT_FOUND',
  CredentialMismatch: 'CREDENTIAL_MISMATCH',
} as const;

export type DepositReason = (typeof DepositReason)[keyof typeof DepositReason];

/** Why the policy service rejected an admin action. */
export const AdminReason = {
  BadSignature: 'BAD_SIGNATURE',
  SignerNotPrincipal: 'SIGNER_NOT_PRINCIPAL',
  PrincipalChangeNotAllowed: 'PRINCIPAL_CHANGE_NOT_ALLOWED',
  StaleAction: 'STALE_ACTION',
} as const;

export type AdminReason = (typeof AdminReason)[keyof typeof AdminReason];
