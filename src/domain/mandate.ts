import { z } from 'zod';
import { ClassicAddressSchema } from '../ledger/address.ts';
import { DecimalAmountSchema } from './amount.ts';

/**
 * Someone the agent may pay: a named person or business, the ledger account
 * they are paid through and, for an exchange account, their destination tag.
 */
export const ApprovedRecipientSchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
  address: ClassicAddressSchema,
  /** When set, only payments with this destination tag are approved. */
  destinationTag: z.number().int().min(0).max(0xffffffff).optional(),
});

export type ApprovedRecipient = z.infer<typeof ApprovedRecipientSchema>;

/**
 * What a business allows its agent to do. It is sent off the ledger only
 * (in the travel package); only its fingerprint is written to the ledger.
 */
export const MandateSchema = z.strictObject({
  version: z.literal(2),
  /** The business account the agent works for. */
  principal: ClassicAddressSchema,
  agent: ClassicAddressSchema,
  approvedRecipients: z.array(ApprovedRecipientSchema).min(1),
  currency: z.literal('RLUSD'),
  perPaymentLimit: DecimalAmountSchema,
  dailyLimit: DecimalAmountSchema,
  expiresAt: z.iso.datetime(),
});

export type Mandate = z.infer<typeof MandateSchema>;

/** True when a payment to this address and destination tag goes to an approved recipient. */
export function isApprovedRecipient(mandate: Mandate, address: string, destinationTag: number | undefined): boolean {
  return mandate.approvedRecipients.some(
    (recipient) =>
      recipient.address === address && (recipient.destinationTag === undefined || recipient.destinationTag === destinationTag),
  );
}
