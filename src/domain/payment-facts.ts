import { z } from 'zod';

const IssuedAmountSchema = z.strictObject({
  currency: z.string(),
  issuer: z.string(),
  value: z.string(),
});

/**
 * Every field an unsigned payment sent for co-signing may contain, after
 * autofill. Any other field is refused, so nothing unexpected is signed.
 */
export const UnsignedPaymentSchema = z.strictObject({
  TransactionType: z.string(),
  Account: z.string(),
  Destination: z.string(),
  DestinationTag: z.number().int().nonnegative().optional(),
  Amount: z.union([z.string(), IssuedAmountSchema]),
  Flags: z.number().int().optional(),
  SendMax: z.unknown().optional(),
  DeliverMin: z.unknown().optional(),
  Paths: z.unknown().optional(),
  Memos: z.array(z.unknown()).optional(),
  InvoiceID: z.string().optional(),
  CredentialIDs: z.array(z.string()).optional(),
  SourceTag: z.number().int().nonnegative().optional(),
  Fee: z.string().regex(/^\d+$/),
  Sequence: z.number().int().nonnegative(),
  LastLedgerSequence: z.number().int().positive(),
  SigningPubKey: z.literal('').optional(),
  NetworkID: z.number().int().optional(),
});

export type UnsignedPayment = z.infer<typeof UnsignedPaymentSchema>;

export type IssuedAmount = z.infer<typeof IssuedAmountSchema>;

/** The facts the decision rules look at, read from an unsigned payment. */
export interface PaymentFacts {
  transactionType: string;
  account: string;
  destination: string;
  destinationTag: number | undefined;
  /** Undefined when the payment is in XRP rather than a token. */
  amount: IssuedAmount | undefined;
  /** The amount in drops when the payment is in XRP. */
  xrpDrops: string | undefined;
  usesUnsupportedFeature: boolean;
  hasMemos: boolean;
  invoiceId: string | undefined;
  feeDrops: bigint;
}

export type ReadPayment = { ok: true; payment: UnsignedPayment; facts: PaymentFacts } | { ok: false };

/** Reads an unsigned payment from untrusted input. Anything malformed is rejected whole. */
export function readUnsignedPayment(input: unknown): ReadPayment {
  const parsed = UnsignedPaymentSchema.safeParse(input);
  if (!parsed.success) return { ok: false };
  const payment = parsed.data;

  return {
    ok: true,
    payment,
    facts: {
      transactionType: payment.TransactionType,
      account: payment.Account,
      destination: payment.Destination,
      destinationTag: payment.DestinationTag,
      amount: typeof payment.Amount === 'string' ? undefined : payment.Amount,
      xrpDrops: typeof payment.Amount === 'string' ? payment.Amount : undefined,
      usesUnsupportedFeature:
        (payment.Flags ?? 0) !== 0 ||
        payment.SendMax !== undefined ||
        payment.DeliverMin !== undefined ||
        payment.Paths !== undefined,
      hasMemos: payment.Memos !== undefined && payment.Memos.length > 0,
      invoiceId: payment.InvoiceID,
      feeDrops: BigInt(payment.Fee),
    },
  };
}
