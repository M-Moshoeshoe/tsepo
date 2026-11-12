import { hashes, multisign, type Client, type SubmittableTransaction, type Wallet } from 'xrpl';
import { z } from 'zod';

export interface Signed {
  blob: string;
  hash: string;
}

export interface Outcome {
  hash: string;
  result: string;
  ledgerIndex: number;
  deliveredAmount: unknown;
}

/** Called with the transaction hash before it is submitted, so it can be recorded first. */
export type BeforeSubmit = (hash: string) => void | Promise<void>;

/**
 * Adds the SourceTag when one is given and the transaction has none, then
 * lets autofill set Fee, Sequence and LastLedgerSequence. Only agent
 * transactions pass a SourceTag.
 */
export async function prepareTransaction<T extends SubmittableTransaction>(
  client: Client,
  tx: T,
  options: { sourceTag?: number | undefined; signersCount?: number | undefined } = {},
): Promise<T> {
  const { sourceTag, signersCount } = options;
  const tagged: T = sourceTag !== undefined && tx.SourceTag === undefined ? { ...tx, SourceTag: sourceTag } : tx;
  return client.autofill(tagged, signersCount);
}

export async function signSingle(
  client: Client,
  wallet: Wallet,
  tx: SubmittableTransaction,
  sourceTag?: number,
): Promise<Signed> {
  if (wallet.address !== tx.Account) throw new Error('The signing key does not belong to the sending account');
  const prepared = await prepareTransaction(client, tx, { sourceTag });
  const { tx_blob, hash } = wallet.sign(prepared);
  return { blob: tx_blob, hash };
}

/** One signer's part of a multisigned transaction. The transaction must already be prepared. */
export function signPart(wallet: Wallet, prepared: SubmittableTransaction): string {
  return wallet.sign(prepared, true).tx_blob;
}

export function combineParts(parts: string[]): Signed {
  if (parts.length === 0) throw new Error('A multisigned transaction needs at least one signer');
  const blob = multisign(parts);
  return { blob, hash: hashes.hashSignedTx(blob) };
}

export async function signMulti(
  client: Client,
  signers: Wallet[],
  tx: SubmittableTransaction,
  sourceTag?: number,
): Promise<Signed> {
  const prepared = await prepareTransaction(client, tx, { sourceTag, signersCount: signers.length });
  return combineParts(signers.map((signer) => signPart(signer, prepared)));
}

const ValidatedSchema = z.object({
  result: z.object({
    hash: z.string(),
    ledger_index: z.number(),
    validated: z.literal(true),
    meta: z.object({ TransactionResult: z.string(), delivered_amount: z.unknown().optional() }),
  }),
});

/** Records the hash, then waits for the result in a validated ledger. */
async function submitValidated(client: Client, signed: Signed, beforeSubmit?: BeforeSubmit): Promise<Outcome> {
  await beforeSubmit?.(signed.hash);
  const { result } = ValidatedSchema.parse(await client.submitAndWait(signed.blob));
  if (result.hash !== signed.hash) throw new Error(`Ledger returned hash ${result.hash}, expected ${signed.hash}`);
  return {
    hash: result.hash,
    result: result.meta.TransactionResult,
    ledgerIndex: result.ledger_index,
    deliveredAmount: result.meta.delivered_amount,
  };
}

/** Submits and requires tesSUCCESS. A failure stops the caller and is never retried. */
export async function submitAndConfirm(client: Client, signed: Signed, beforeSubmit?: BeforeSubmit): Promise<Outcome> {
  const outcome = await submitValidated(client, signed, beforeSubmit);
  if (outcome.result !== 'tesSUCCESS') {
    throw new Error(`Transaction ${outcome.hash} failed with ${outcome.result}. It will not be retried.`);
  }
  return outcome;
}

/** Submits and returns the validated result without requiring success. Never retried. */
export async function submitAndReport(client: Client, signed: Signed, beforeSubmit?: BeforeSubmit): Promise<Outcome> {
  return submitValidated(client, signed, beforeSubmit);
}

const PreliminarySchema = z.object({ result: z.object({ engine_result: z.string() }) });

/**
 * Submits a transaction that must be rejected, and checks the exact code.
 * A tec code is final only once validated, so it is awaited. Other codes
 * (tef, tem) mean the transaction never enters a ledger, so the server's
 * answer is final; fail_hard stops it being relayed.
 */
export async function submitExpectingRejection(
  client: Client,
  signed: Signed,
  expected: string,
  beforeSubmit?: BeforeSubmit,
): Promise<string> {
  let result: string;
  if (expected.startsWith('tec')) {
    result = (await submitValidated(client, signed, beforeSubmit)).result;
  } else {
    await beforeSubmit?.(signed.hash);
    const response = await client.request({ command: 'submit', tx_blob: signed.blob, fail_hard: true });
    result = PreliminarySchema.parse(response).result.engine_result;
  }

  if (result === 'tesSUCCESS') throw new Error(`Transaction ${signed.hash} succeeded but should have been rejected`);
  if (result !== expected) throw new Error(`Transaction ${signed.hash} was rejected with ${result}, expected ${expected}`);
  return result;
}
