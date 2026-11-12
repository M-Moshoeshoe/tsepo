import type { Client } from 'xrpl';
import { submitAndConfirm, submitExpectingRejection, type Outcome, type Signed } from '../ledger/submit.ts';
import { printLine, printTx } from './output.ts';

function printSubmitting(hash: string): void {
  printLine(`submitting ${hash}`);
}

/** Submits, requires tesSUCCESS, and prints the hash and explorer link. */
export async function confirm(client: Client, signed: Signed): Promise<Outcome> {
  const outcome = await submitAndConfirm(client, signed, printSubmitting);
  printTx(outcome.result, outcome.hash);
  return outcome;
}

/** Submits a transaction that must be rejected with `expected`, and prints the result. */
export async function expectRejection(client: Client, signed: Signed, expected: string): Promise<string> {
  const result = await submitExpectingRejection(client, signed, expected, printSubmitting);
  if (result.startsWith('tec')) printTx(`rejected by the ledger with ${result}`, signed.hash);
  else printLine(`rejected with ${result}; never entered a ledger, no fee charged`);
  return result;
}
