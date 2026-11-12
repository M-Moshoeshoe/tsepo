import { hashes, multisign, type Client, type SubmittableTransaction, type Wallet } from 'xrpl';
import { z } from 'zod';
import { printLine, printTx } from './output.ts';

export interface Signed {
  blob: string;
  hash: string;
}

export interface Outcome {
  hash: string;
  result: string;
  deliveredAmount: unknown;
}

/**
 * Adds the SourceTag when one is given and the transaction has none, then
 * lets autofill set Fee, Sequence and LastLedgerSequence. Only agent
 * transactions pass a SourceTag.
 */
async function prepare<T extends SubmittableTransaction>(
  client: Client,
  tx: T,
  sourceTag: number | undefined,
  signersCount?: number,
): Promise<T> {
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
  const prepared = await prepare(client, tx, sourceTag);
  const { tx_blob, hash } = wallet.sign(prepared);
  return { blob: tx_blob, hash };
}

export async function signMulti(
  client: Client,
  signers: Wallet[],
  tx: SubmittableTransaction,
  sourceTag?: number,
): Promise<Signed> {
  if (signers.length === 0) throw new Error('A multisigned transaction needs at least one signer');
  const prepared = await prepare(client, tx, sourceTag, signers.length);
  const blob = multisign(signers.map((signer) => signer.sign(prepared, true).tx_blob));
  return { blob, hash: hashes.hashSignedTx(blob) };
}

const ValidatedSchema = z.object({
  result: z.object({
    hash: z.string(),
    validated: z.literal(true),
    meta: z.object({ TransactionResult: z.string(), delivered_amount: z.unknown().optional() }),
  }),
});

/** Records the hash, then waits for the result in a validated ledger. */
async function submitValidated(client: Client, signed: Signed): Promise<Outcome> {
  printLine(`submitting ${signed.hash}`);
  const { result } = ValidatedSchema.parse(await client.submitAndWait(signed.blob));
  if (result.hash !== signed.hash) throw new Error(`Ledger returned hash ${result.hash}, expected ${signed.hash}`);
  return { hash: result.hash, result: result.meta.TransactionResult, deliveredAmount: result.meta.delivered_amount };
}

/** Submits and requires tesSUCCESS. A failure stops the spike and is never retried. */
export async function submitAndConfirm(client: Client, signed: Signed): Promise<Outcome> {
  const outcome = await submitValidated(client, signed);
  if (outcome.result !== 'tesSUCCESS') {
    throw new Error(`Transaction ${outcome.hash} failed with ${outcome.result}. It will not be retried.`);
  }
  printTx(outcome.result, outcome.hash);
  return outcome;
}

const PreliminarySchema = z.object({ result: z.object({ engine_result: z.string() }) });

/**
 * Submits a transaction that must be rejected, and checks the exact code.
 * A tec code is final only once validated, so it is awaited. Other codes
 * (tef, tem) mean the transaction never enters a ledger, so the server's
 * answer is final; fail_hard stops it being relayed.
 */
export async function submitExpectingRejection(client: Client, signed: Signed, expected: string): Promise<string> {
  let result: string;
  if (expected.startsWith('tec')) {
    result = (await submitValidated(client, signed)).result;
  } else {
    printLine(`submitting ${signed.hash}`);
    const response = await client.request({ command: 'submit', tx_blob: signed.blob, fail_hard: true });
    result = PreliminarySchema.parse(response).result.engine_result;
  }

  if (result === 'tesSUCCESS') throw new Error(`Transaction ${signed.hash} succeeded but should have been rejected`);
  if (result !== expected) throw new Error(`Transaction ${signed.hash} was rejected with ${result}, expected ${expected}`);

  if (result.startsWith('tec')) printTx(`rejected by the ledger with ${result}`, signed.hash);
  else printLine(`rejected with ${result}; never entered a ledger, no fee charged`);
  return result;
}
