import { z } from 'zod';
import { ClassicAddressSchema } from '../ledger/address.ts';
import { DecimalAmountSchema } from './amount.ts';

/**
 * What a business allows its agent to do. Addresses are public ledger
 * identifiers. A mandate holds no personal data, and only its fingerprint
 * is written to the ledger.
 */
export const MandateSchema = z.strictObject({
  version: z.literal(1),
  /** The business account the agent works for. */
  principal: ClassicAddressSchema,
  agent: ClassicAddressSchema,
  approvedRecipients: z.array(ClassicAddressSchema).min(1),
  currency: z.literal('RLUSD'),
  perPaymentLimit: DecimalAmountSchema,
  dailyLimit: DecimalAmountSchema,
  expiresAt: z.iso.datetime(),
});

export type Mandate = z.infer<typeof MandateSchema>;
