import { z } from 'zod';
import { DecimalAmountSchema } from '../domain/amount.ts';
import { MandateSchema } from '../domain/mandate.ts';

/** The mandate the policy service enforces for one agent, keyed by agent address. */
export const MandateRecordSchema = z.strictObject({
  mandate: MandateSchema,
  /** issuedAt of the admin action that set it; later actions must be newer. */
  issuedAt: z.iso.datetime(),
  signer: z.string(),
});

export type MandateRecord = z.infer<typeof MandateRecordSchema>;

/** A payment the policy service co-signed, keyed by InvoiceID. Daily totals are summed from these. */
export const ApprovalRecordSchema = z.strictObject({
  invoiceId: z.string(),
  agent: z.string(),
  destination: z.string(),
  destinationTag: z.number().int().optional(),
  amount: DecimalAmountSchema,
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  approvedAt: z.iso.datetime(),
  /** Fingerprint of the exact unsigned payment, so a repeat request is recognised. */
  paymentDigest: z.string(),
});

export type ApprovalRecord = z.infer<typeof ApprovalRecordSchema>;

const ReviewEntrySchema = z.strictObject({
  kind: z.literal('review'),
  at: z.iso.datetime(),
  agent: z.string().optional(),
  decision: z.enum(['signed', 'refused']),
  reasons: z.array(z.string()),
  invoiceId: z.string().optional(),
  destination: z.string().optional(),
  destinationTag: z.number().int().optional(),
  amount: z.string().optional(),
  /** The agent's stated purpose, stored as data for review, cut to 280 characters. */
  purpose: z.string().max(280),
  /** For SERVICE_ERROR only: the error message, cut to 200 characters. Never contains a key. */
  detail: z.string().max(200).optional(),
});

const AdminEntrySchema = z.strictObject({
  kind: z.literal('admin'),
  at: z.iso.datetime(),
  action: z.string(),
  decision: z.enum(['applied', 'rejected']),
  reasons: z.array(z.string()),
  agent: z.string().optional(),
  signer: z.string().optional(),
});

/** One line of the policy service's append-only log. */
export const PolicyLogEntrySchema = z.discriminatedUnion('kind', [ReviewEntrySchema, AdminEntrySchema]);

export type PolicyLogEntry = z.infer<typeof PolicyLogEntrySchema>;
export type ReviewLogEntry = z.infer<typeof ReviewEntrySchema>;
