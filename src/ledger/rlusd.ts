import type { Client, IssuedCurrencyAmount, Payment } from 'xrpl';
import { z } from 'zod';
import { getTrustLine } from './reads.ts';
import type { Outcome } from './submit.ts';
import { RLUSD } from './testnet.ts';

export function rlusd(value: string): IssuedCurrencyAmount {
  return { currency: RLUSD.currency, issuer: RLUSD.issuer, value };
}

export interface RlusdPaymentOptions {
  credentialIds?: string[] | undefined;
  destinationTag?: number | undefined;
  invoiceId?: string | undefined;
}

/** A plain RLUSD payment. Partial payments, paths and memos are never used. */
export function rlusdPayment(from: string, to: string, value: string, options: RlusdPaymentOptions = {}): Payment {
  const { credentialIds, destinationTag, invoiceId } = options;
  return {
    TransactionType: 'Payment',
    Account: from,
    Destination: to,
    Amount: rlusd(value),
    ...(destinationTag === undefined ? {} : { DestinationTag: destinationTag }),
    ...(invoiceId === undefined ? {} : { InvoiceID: invoiceId }),
    ...(credentialIds === undefined ? {} : { CredentialIDs: credentialIds }),
  };
}

/** The RLUSD balance exactly as the ledger reports it, "0" when there is no trust line. */
export async function rlusdBalance(client: Client, account: string): Promise<string> {
  const line = await getTrustLine(client, { account, issuer: RLUSD.issuer, currency: RLUSD.currency });
  return line?.balance ?? '0';
}

/** Fails unless the account holds at least `minimum` RLUSD. */
export async function requireRlusd(client: Client, account: string, minimum: number): Promise<void> {
  const balance = await rlusdBalance(client, account);
  if (Number(balance) < minimum) {
    throw new Error(`Account ${account} holds ${balance} RLUSD, needs at least ${minimum}. Fund it first.`);
  }
}

const DeliveredSchema = z.object({
  currency: z.literal(RLUSD.currency),
  issuer: z.literal(RLUSD.issuer),
  value: z.string(),
});

/** Confirms the ledger delivered exactly the amount sent. */
export function requireDelivered(outcome: Outcome, value: string): void {
  const delivered = DeliveredSchema.parse(outcome.deliveredAmount);
  if (delivered.value !== value) {
    throw new Error(`Transaction ${outcome.hash} delivered ${delivered.value} RLUSD, expected ${value}`);
  }
}
