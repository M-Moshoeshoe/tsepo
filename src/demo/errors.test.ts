import { APIConnectionError, AuthenticationError } from '@anthropic-ai/sdk';
import { describe, expect, it } from 'vitest';
import { ConnectionError, NotConnectedError, TimeoutError } from 'xrpl';
import { z } from 'zod';
import { CallBudgetExceededError } from '../agent/call-budget.ts';
import { ModelReadError } from '../agent/payout-parser.ts';
import { LedgerResultError } from '../ledger/submit.ts';
import { DemoError, PLAIN_ERRORS, plainRunError } from './errors.ts';

const HASH = 'A'.repeat(64);

describe('plain run errors', () => {
  it('keeps a plain sentence that the engine already wrote', () => {
    expect(plainRunError(new DemoError('The agent is revoked. Restore the sample data to register it again.'))).toBe(
      'The agent is revoked. Restore the sample data to register it again.',
    );
  });

  it('says when Claude is unavailable, without request IDs or API text', () => {
    const auth = new AuthenticationError(
      401,
      { type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } },
      'invalid x-api-key',
      new Headers({ 'request-id': 'req_011Cg' }),
    );
    for (const error of [auth, new APIConnectionError({ message: 'Connection error.' })]) {
      const text = plainRunError(error);
      expect(text).toBe(PLAIN_ERRORS.claudeUnavailable);
      expect(text).not.toMatch(/req_|x-api-key|401|authentication_error/);
    }
  });

  it('says when Claude answered but its reading could not be used', () => {
    expect(plainRunError(new ModelReadError('The model response was cut off'))).toBe(PLAIN_ERRORS.claudeUnreadable);
  });

  it('says when the daily Claude cap is reached, and what still works', () => {
    expect(plainRunError(new CallBudgetExceededError(50))).toBe(
      'The agent has used all 50 AI readings for today. The stories with your agent work again after 02:00 SAST; the unknown agent story and Restore sample data still work.',
    );
  });

  it('says when the ledger cannot be reached', () => {
    for (const error of [new ConnectionError('websocket was closed'), new NotConnectedError('not connected'), new TimeoutError('timeout')]) {
      expect(plainRunError(error)).toBe(PLAIN_ERRORS.ledgerUnreachable);
    }
  });

  it('says when the RLUSD balance is too low, and names other ledger results', () => {
    expect(plainRunError(new LedgerResultError('tecPATH_PARTIAL', HASH))).toBe(PLAIN_ERRORS.rlusdLow);
    expect(plainRunError(new LedgerResultError('tecUNFUNDED_PAYMENT', HASH))).toBe(PLAIN_ERRORS.rlusdLow);
    expect(plainRunError(new LedgerResultError('tecNO_DST', HASH))).toBe('The XRP Ledger rejected a transaction with tecNO_DST.');
  });

  it('never repeats the text of an unknown error', () => {
    const text = plainRunError(new Error('connect ECONNREFUSED 10.0.0.1:443 request_id=req_123'));
    expect(text).toBe(PLAIN_ERRORS.unknown);
    expect(plainRunError(z.string().safeParse(1).error)).toBe(PLAIN_ERRORS.unexpectedShape);
    expect(plainRunError('a thrown string')).toBe(PLAIN_ERRORS.unknown);
  });

  it('always returns one sentence that ends with a full stop', () => {
    for (const text of Object.values(PLAIN_ERRORS)) expect(text).toMatch(/^[A-Z].*\.$/);
  });
});
