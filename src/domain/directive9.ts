import { z } from 'zod';
import { ClassicAddressSchema } from '../ledger/address.ts';
import { DecimalAmountSchema } from './amount.ts';
import { AGENT_MANDATE_CREDENTIAL_TYPE } from './credential-check.ts';
import { fingerprintOf } from './fingerprint.ts';
import { MandateSchema } from './mandate.ts';

const PostalAddressSchema = z.strictObject({
  street: z.string().min(1).max(120),
  city: z.string().min(1).max(80),
  postalCode: z.string().min(1).max(16),
  country: z.string().regex(/^[A-Z]{2}$/, { message: 'Use a two letter country code' }),
});

const FingerprintSchema = z.string().regex(/^sha256:[0-9a-f]{64}$/);

/**
 * The travel information an exchange receives before an agent payment
 * arrives (FIC Directive 9). It is sent off the ledger; only its
 * fingerprint goes on the ledger, in the payment's InvoiceID.
 */
export const Directive9PackageSchema = z.strictObject({
  version: z.literal(1),
  reference: z.string().regex(/^[A-Za-z0-9-]{1,64}$/),
  createdAt: z.iso.datetime(),
  originator: z.strictObject({
    registeredName: z.string().min(1).max(160),
    registrationNumber: z.string().min(1).max(40),
    address: PostalAddressSchema,
    /** The agent account that sends the payment. */
    ledgerAddress: ClassicAddressSchema,
  }),
  beneficiary: z.strictObject({
    name: z.string().min(1).max(160),
    /** The exchange agent lane account that receives the payment. */
    ledgerAddress: ClassicAddressSchema,
    destinationTag: z.number().int().min(0).max(0xffffffff),
  }),
  transfer: z.strictObject({
    amount: DecimalAmountSchema,
    currency: z.literal('RLUSD'),
    purpose: z.string().min(1).max(280),
  }),
  agent: z.strictObject({
    ledgerAddress: ClassicAddressSchema,
    credentialIssuer: ClassicAddressSchema,
    credentialType: z.literal(AGENT_MANDATE_CREDENTIAL_TYPE),
    mandate: MandateSchema,
    mandateFingerprint: FingerprintSchema,
  }),
});

export type Directive9Package = z.infer<typeof Directive9PackageSchema>;

export function packageFingerprint(pkg: Directive9Package): string {
  return fingerprintOf(pkg);
}
