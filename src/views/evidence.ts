import { z } from 'zod';
import type { ReviewLogEntry } from '../policy/records.ts';
import { TESTNET_EXPLORER } from '../ledger/testnet.ts';
import { STATUS_LABELS, type BusinessPayment } from './payments.ts';
import { reasonText } from './status.ts';

const HashSchema = z.string().regex(/^[0-9A-F]{64}$/);

/**
 * The evidence file for one payment, as the business downloads it. Validated
 * before it is sent, so a malformed record never leaves the server. It holds
 * no key or seed: only names, amounts, addresses, hashes and reasons.
 */
export const PaymentEvidenceSchema = z.strictObject({
  kind: z.literal('tsepo-payment-evidence'),
  version: z.literal(1),
  generatedAt: z.iso.datetime(),
  network: z.literal('XRP Ledger Testnet'),
  business: z.strictObject({ name: z.string(), ledgerAddress: z.string() }),
  agent: z.strictObject({ name: z.string(), ledgerAddress: z.string() }),
  instruction: z.strictObject({ receivedAt: z.iso.datetime(), text: z.string() }),
  payment: z.strictObject({
    reference: z.string(),
    recipient: z.string(),
    amount: z.string(),
    currency: z.literal('RLUSD'),
    purpose: z.string(),
    status: z.string(),
    reasons: z.array(z.strictObject({ code: z.string(), text: z.string() })),
  }),
  steps: z.array(z.strictObject({ step: z.string(), state: z.enum(['done', 'failed', 'not-reached']), transactionHash: HashSchema.optional() })),
  approvalDecisions: z.array(
    z.strictObject({ at: z.iso.datetime(), decision: z.enum(['signed', 'refused']), reasons: z.array(z.string()) }),
  ),
  ledger: z.strictObject({ transactionHash: HashSchema, explorerUrl: z.url() }).nullable(),
  travelRuleReference: z.string().nullable(),
});

export type PaymentEvidence = z.infer<typeof PaymentEvidenceSchema>;

export interface EvidenceInput {
  payment: BusinessPayment;
  instructionText: string;
  business: { name: string; ledgerAddress: string };
  agent: { name: string; ledgerAddress: string };
  /** The approval service's log; only the entries for this payment's Travel Rule reference are kept. */
  policyLog: readonly ReviewLogEntry[];
  now: Date;
}

/** Builds and validates the evidence file. Throws if the result does not match the schema. */
export function paymentEvidence(input: EvidenceInput): PaymentEvidence {
  const { payment } = input;
  const decisions =
    payment.invoiceId === undefined ? [] : input.policyLog.filter((entry) => entry.invoiceId === payment.invoiceId && entry.at >= payment.instructionAt);
  return PaymentEvidenceSchema.parse({
    kind: 'tsepo-payment-evidence',
    version: 1,
    generatedAt: input.now.toISOString(),
    network: 'XRP Ledger Testnet',
    business: input.business,
    agent: input.agent,
    instruction: { receivedAt: payment.instructionAt, text: input.instructionText },
    payment: {
      reference: payment.intent.reference,
      recipient: payment.intent.payee,
      amount: payment.intent.amount,
      currency: 'RLUSD',
      purpose: payment.intent.purpose,
      status: STATUS_LABELS[payment.status],
      reasons: payment.reasons.map((code) => ({ code, text: reasonText(code) })),
    },
    steps: payment.steps.map((step) => ({
      step: step.label,
      state: step.state,
      ...(step.hash === undefined ? {} : { transactionHash: step.hash }),
    })),
    approvalDecisions: decisions.map((entry) => ({ at: entry.at, decision: entry.decision, reasons: entry.reasons })),
    ledger:
      payment.status === 'paid' && payment.hash !== undefined
        ? { transactionHash: payment.hash, explorerUrl: `${TESTNET_EXPLORER}/transactions/${payment.hash}` }
        : null,
    travelRuleReference: payment.invoiceId ?? null,
  });
}

/** "tsepo-evidence-INV-1042-2026-11-12.json" */
export function evidenceFileName(reference: string, instructionAt: string): string {
  return `tsepo-evidence-${reference}-${instructionAt.slice(0, 10)}.json`;
}
