import { AnthropicError } from '@anthropic-ai/sdk';
import { ConnectionError, DisconnectedError, NotConnectedError, TimeoutError } from 'xrpl';
import { ZodError } from 'zod';
import { CallBudgetExceededError } from '../agent/call-budget.ts';
import { ModelReadError } from '../agent/payout-parser.ts';
import { LedgerResultError } from '../ledger/submit.ts';

/**
 * An error whose message is already a plain sentence for the person running
 * the demo. Raw details travel in `cause` and reach the server log only.
 */
export class DemoError extends Error {
  constructor(plain: string, options?: { cause?: unknown }) {
    super(plain, options);
    this.name = 'DemoError';
  }
}

/** Ledger results that mean the sender did not hold enough of the asset. */
const LOW_BALANCE_RESULTS: readonly string[] = ['tecPATH_PARTIAL', 'tecPATH_DRY', 'tecUNFUNDED_PAYMENT', 'tecINSUFFICIENT_FUNDS'];

export const PLAIN_ERRORS = {
  rlusdLow: "The agent's RLUSD balance is too low for this payment. Restore the sample data to return the RLUSD to the agent.",
  ledgerUnreachable: 'The XRP Ledger Testnet could not be reached. Try again in a minute.',
  claudeUnavailable: 'Claude is not available right now, so the agent could not read its instruction. Try again in a few minutes.',
  claudeUnreadable: 'Claude could not read the instruction, so the agent paid nothing.',
  unexpectedShape: 'A response did not have the expected shape, so the run stopped.',
  unknown: 'Something went wrong on the server, so the run stopped.',
} as const;

export function claudeCapReached(limit: number): string {
  return `The agent has used all ${limit} AI readings for today. Instructions and the stories with your agent work again after 02:00 SAST; the unknown agent story and Restore sample data still work.`;
}

/** A plain sentence for a ledger result code that stopped a transaction. */
export function ledgerResultSentence(result: string): string {
  if (LOW_BALANCE_RESULTS.includes(result)) return PLAIN_ERRORS.rlusdLow;
  return `The XRP Ledger rejected a transaction with ${result}.`;
}

/**
 * Turns any error from a demo run into one plain sentence that ends with a
 * full stop. It never includes request IDs, API text or stack traces.
 */
export function plainRunError(error: unknown): string {
  if (error instanceof DemoError) return error.message;
  if (error instanceof CallBudgetExceededError) return claudeCapReached(error.limit);
  if (error instanceof ModelReadError) return PLAIN_ERRORS.claudeUnreadable;
  if (error instanceof AnthropicError) return PLAIN_ERRORS.claudeUnavailable;
  if (
    error instanceof ConnectionError ||
    error instanceof NotConnectedError ||
    error instanceof DisconnectedError ||
    error instanceof TimeoutError
  ) {
    return PLAIN_ERRORS.ledgerUnreachable;
  }
  if (error instanceof LedgerResultError) return ledgerResultSentence(error.result);
  if (error instanceof ZodError) return PLAIN_ERRORS.unexpectedShape;
  return PLAIN_ERRORS.unknown;
}
