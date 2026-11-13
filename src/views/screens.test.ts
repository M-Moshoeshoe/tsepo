import { describe, expect, it } from 'vitest';
import { PolicyReason } from '../domain/reasons.ts';
import { refusalChecks, ledgerRejectionChecks } from './checks.ts';
import { actorName, decisionNote } from './actors.ts';
import { decidedBy, paymentEvents } from './payment-events.ts';
import { SCENARIOS } from './scenarios.ts';
import { depositStatus, LEDGER_REJECTION_STATUS, refusalStatus } from './status.ts';
import { dailyUsage } from './usage.ts';

describe('daily usage', () => {
  it('says how much is used and left', () => {
    expect(dailyUsage('2', '5')).toEqual({ used: '2', left: '3', limit: '5', percent: 40, sentence: 'Daily limit: 5 RLUSD. 2 used, 3 left' });
  });

  it('never shows less than zero left', () => {
    expect(dailyUsage('6', '5')).toMatchObject({ left: '0', percent: 100 });
  });
});

describe('payment events', () => {
  const at = '2026-11-12T16:42:00.000Z';

  it('tells a cleared payment from package to settlement', () => {
    const events = paymentEvents({
      kind: 'deposit',
      at,
      status: depositStatus({ status: 'Cleared', reasons: [] }),
      checks: [{ id: 'credential', label: 'Credential valid', state: 'passed' }],
      packageReceivedAt: '2026-11-12T16:41:58.000Z',
    });
    expect(events.map((event) => [event.id, event.state])).toEqual([
      ['package', 'done'],
      ['credential', 'done'],
      ['cosign', 'done'],
      ['settled', 'done'],
      ['outcome', 'done'],
    ]);
  });

  it('stops a refused payment at the co-signature with the exact status words', () => {
    const status = refusalStatus([PolicyReason.OverDailyLimit, PolicyReason.SplitPaymentPattern]);
    const checks = refusalChecks([PolicyReason.OverDailyLimit, PolicyReason.SplitPaymentPattern], true);
    const events = paymentEvents({ kind: 'refusal', at, status, checks, packageReceivedAt: at });
    const cosign = events.find((event) => event.id === 'cosign');
    expect(cosign).toMatchObject({ state: 'failed', detail: 'Refused by the approval service: payments split to get around the daily limit' });
    expect(events.find((event) => event.id === 'settled')?.state).toBe('not-reached');
  });

  it('shows a ledger rejection with no package and a failed credential check', () => {
    const events = paymentEvents({ kind: 'rejection', at, status: LEDGER_REJECTION_STATUS, checks: ledgerRejectionChecks(), packageReceivedAt: undefined });
    expect(events.map((event) => [event.id, event.state])).toEqual([
      ['package', 'not-reached'],
      ['credential', 'failed'],
      ['settled', 'failed'],
    ]);
    expect(events.at(-1)?.detail).toBe('Rejected by the ledger: no verified agent credential');
  });

  it('names who decided each kind of entry, the same way on every page', () => {
    expect([decidedBy('deposit'), decidedBy('refusal'), decidedBy('rejection')].map((actor) => actorName(actor))).toEqual([
      'the platform checks',
      'the approval service',
      'the XRP Ledger',
    ]);
    expect(actorName('ledger', true)).toBe('The XRP Ledger');
  });

  it('says an accepted payment needed the approval service and passed the platform checks', () => {
    expect(decisionNote('exchange', 'cleared')).toBe('It needed the approval service to sign, and the platform checks accepted it.');
    expect(decisionNote('exchange', 'held')).toContain('held it for review');
  });

  it("labels refused attempts as shared by the agent's approval service", () => {
    expect(decisionNote('policy', 'refused')).toContain("Shared by the agent's approval service");
  });
});

describe('tour stories', () => {
  const decider = (kind: string) => SCENARIOS.find((scenario) => scenario.kind === kind)?.decidedBy;

  it('names the actor that clears or stops each story, matching the exchange payments list', () => {
    // Paying Naledi is an accepted payment, decided by the platform checks.
    expect(decider('scenario-2')).toBe(decidedBy('deposit'));
    // The unknown agent ends with the ledger rejection.
    expect(decider('scenario-1')).toBe(decidedBy('rejection'));
    expect([decider('scenario-3'), decider('scenario-4')]).toEqual(['policy', 'policy']);
  });

  it('tells the four stories in tour order, with one plain line each', () => {
    expect(SCENARIOS.map((scenario) => scenario.kind)).toEqual(['scenario-2', 'scenario-3', 'scenario-1', 'scenario-4']);
    for (const scenario of SCENARIOS) {
      expect(`${scenario.title} ${scenario.proves}`).not.toMatch(/\n|[–—]|n't\b|\b[Dd]emo\b|[Ss]cenario/);
    }
  });
});
