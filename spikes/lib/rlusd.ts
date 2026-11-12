import type { Client, IssuedCurrencyAmount, Payment } from 'xrpl';
import { z } from 'zod';
import { RLUSD } from '../../src/ledger/testnet.ts';
import { getTrustLine } from './ledger.ts';
import type { Outcome } from './submit.ts';

export function rlusd(value: string): IssuedCurrencyAmount {
  return { currency: RLUSD.currency, issuer: RLUSD.issuer, value };
}

/** A plain RLUSD payment. Partial payments are never used. */
export function rlusdPayment(from: string, to: string, value: string, credentialIds?: string[]): Payment {
  return {
    TransactionType: 'Payment',
    Account: from,
    Destination: to,
    Amount: rlusd(value),
    ...(credentialIds === undefined ? {} : { CredentialIDs: credentialIds }),
  };
}

export async function rlusdBalance(client: Client, account: string): Promise<number> {
  const line = await getTrustLine(client, { account, issuer: RLUSD.issuer, currency: RLUSD.currency });
  return line === undefined ? 0 : Number(line.balance);
}

/** Fails unless the account holds at least `minimum` RLUSD. */
export async function requireRlusd(client: Client, account: string, minimum: number): Promise<void> {
  const balance = await rlusdBalance(client, account);
  if (balance < minimum) {
    throw new Error(`Account ${account} holds ${balance} RLUSD, needs at least ${minimum}. Fund it first (see the Phase 1 report).`);
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
