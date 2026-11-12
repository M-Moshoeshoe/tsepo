import { z } from 'zod';
import { ClassicAddressSchema } from '../ledger/address.ts';

/** A positive decimal amount written as a string, as the ledger expects. */
const DecimalAmountSchema = z
  .string()
  .regex(/^(0|[1-9]\d*)(\.\d{1,15})?$/, { message: 'Not a decimal amount' })
  .refine((value) => Number(value) > 0, { message: 'Amount must be above zero' });

/**
 * What a business allows its agent to do. Addresses are public ledger
 * identifiers. A mandate holds no personal data, and only its fingerprint
 * is written to the ledger.
 */
export const MandateSchema = z.strictObject({
  version: z.literal(1),
  principal: ClassicAddressSchema,
  agent: ClassicAddressSchema,
  approvedRecipients: z.array(ClassicAddressSchema).min(1),
  currency: z.literal('RLUSD'),
  perPaymentLimit: DecimalAmountSchema,
  dailyLimit: DecimalAmountSchema,
  expiresAt: z.iso.datetime(),
});

export type Mandate = z.infer<typeof MandateSchema>;
