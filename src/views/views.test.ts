import { describe, expect, it } from 'vitest';
import { makeMandate, makePackage, makeParties } from '../../test/fixtures.ts';
import type { PayoutRecord } from '../agent/records.ts';
import { DepositReason, PolicyReason } from '../domain/reasons.ts';
import { payoutSteps, runActivity } from './activity.ts';
import { depositChecks, ledgerRejectionChecks, refusalChecks } from './checks.ts';
import { depositStatus, formatSast, formatSastDate, formatSastTime, LEDGER_REJECTION_STATUS, reasonText, refusalStatus } from './status.ts';

const parties = makeParties();
const pkg = makePackage(parties, makeMandate(parties));
const lane = parties.lane.address;

describe('status words', () => {
  it('uses the exact words for each case', () => {
    expect(depositStatus({ status: 'Cleared', reasons: [] }).label).toBe('Cleared');
    expect(depositStatus({ status: 'Held', reasons: [DepositReason.PackageMissing] }).label).toBe(
      'Held: no verified sender for this payment',
    );
    expect(refusalStatus([PolicyReason.OverDailyLimit, PolicyReason.SplitPaymentPattern]).label).toBe(
      'Refused by the approval service: payments split to get around the daily limit',
    );
    expect(refusalStatus([PolicyReason.CredentialMissing], '2026-11-12T15:11:37Z').label).toBe(
      'Refused: this agent was revoked at 17:11 SAST',
    );
    expect(LEDGER_REJECTION_STATUS.label).toBe('Rejected by the ledger: no verified agent credential');
  });

  it('gives the right tone to each status', () => {
    expect(depositStatus({ status: 'Cleared', reasons: [] }).tone).toBe('cleared');
    expect(depositStatus({ status: 'Held', reasons: [DepositReason.AmountMismatch] }).tone).toBe('held');
    expect(refusalStatus([PolicyReason.AgentNotRegistered]).tone).toBe('refused');
  });

  it('explains other refusals in plain words', () => {
    expect(refusalStatus([PolicyReason.AgentNotRegistered]).label).toBe(
      'Refused by the approval service: this agent is not registered',
    );
  });

  it('has plain words for every reason code', () => {
    for (const reason of [...Object.values(PolicyReason), ...Object.values(DepositReason)]) {
      expect(reasonText(reason)).not.toBe(reason);
    }
  });

  it('gives short chips for the table', () => {
    expect(depositStatus({ status: 'Held', reasons: [DepositReason.PackageMissing] }).chip).toBe('Held');
    expect(refusalStatus([PolicyReason.SplitPaymentPattern]).chip).toBe('Refused');
    expect(LEDGER_REJECTION_STATUS.chip).toBe('Rejected by the ledger');
    expect(LEDGER_REJECTION_STATUS.category).toBe('rejected');
  });

  it('formats times in SAST, including the date change at 22:00 UTC', () => {
    expect(formatSastTime('2026-11-12T16:02:00Z')).toBe('18:02 SAST');
    expect(formatSastDate('2026-11-12T22:30:00Z')).toBe('13 November 2026');
    expect(formatSast('2026-11-12T16:02:00Z')).toBe('12 November 2026, 18:02 SAST');
  });
});

describe('check timeline', () => {
  it('passes every check for a cleared deposit', () => {
    expect(depositChecks({ reasons: [], amount: '2' }, pkg, lane, 1001).map((c) => c.state)).toEqual([
      'passed',
      'passed',
      'passed',
      'passed',
      'passed',
    ]);
  });

  it('fails only the package check, and checks nothing else, when no package arrived', () => {
    expect(depositChecks({ reasons: [DepositReason.PackageMissing], amount: '1' }, undefined, lane, 1001).map((c) => c.state)).toEqual([
      'not-checked',
      'not-checked',
      'not-checked',
      'failed',
      'not-checked',
    ]);
  });

  it('fails the limits check for a split payment refusal', () => {
    const states = refusalChecks([PolicyReason.OverDailyLimit, PolicyReason.SplitPaymentPattern], true).map((c) => c.state);
    expect(states).toEqual(['passed', 'passed', 'failed', 'passed', 'not-checked']);
  });

  it('fails the credential check for a revoked agent', () => {
    expect(refusalChecks([PolicyReason.CredentialMissing], true)[0]?.state).toBe('failed');
  });

  it('fails only the credential check for a ledger rejection', () => {
    expect(ledgerRejectionChecks().map((c) => c.state)).toEqual([
      'failed',
      'not-checked',
      'not-checked',
      'not-checked',
      'not-checked',
    ]);
  });
});

function event(status: PayoutRecord['status'], extra: Partial<PayoutRecord> = {}): PayoutRecord {
  return { reference: 'INV-1', status, reasons: [], updatedAt: '2026-11-12T10:00:01.000Z', ...extra };
}

describe('payout activity', () => {
  it('marks all four steps done for a paid payout', () => {
    const result = payoutSteps([
      event('package-sent', { invoiceId: 'AB' }),
      event('signed', { hash: 'H1' }),
      event('paid', { hash: 'H1' }),
    ]);
    expect(result.outcome).toBe('paid');
    expect(result.steps.map((step) => step.state)).toEqual(['done', 'done', 'done', 'done']);
    expect(result.steps[3]?.hash).toBe('H1');
  });

  it('stops at co-signing for a refused payout', () => {
    const result = payoutSteps([event('package-sent'), event('refused', { reasons: [PolicyReason.CredentialMissing] })]);
    expect(result.outcome).toBe('refused');
    expect(result.reasons).toEqual([PolicyReason.CredentialMissing]);
    expect(result.steps.map((step) => step.state)).toEqual(['done', 'failed', 'not-reached', 'failed']);
  });

  it('only counts events from the current run', () => {
    const run = {
      id: 'r',
      startedAt: '2026-11-12T10:00:00.000Z',
      instruction: 'Pay',
      intents: [{ payee: 'Naledi Mokoena', amount: '2', purpose: 'Logo', reference: 'INV-1' }],
    };
    const earlier = event('paid', { updatedAt: '2026-11-11T10:00:00.000Z' });
    expect(runActivity(run, [earlier]).payouts[0]?.outcome).toBe('not-started');
  });
});
