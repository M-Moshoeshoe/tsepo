import { describe, expect, it } from 'vitest';
import { AFTER_REVOCATION_PAYOUT, SPLIT_PAYOUTS, VERIFIED_PAYOUT } from '../demo/payout-lists.ts';
import { PolicyReason } from '../domain/reasons.ts';
import type { BusinessPayment, Instruction } from './payments.ts';
import { SCENARIOS } from './scenarios.ts';
import {
  CFO_QUESTIONS,
  LAST_STEP,
  parseTourParam,
  stepEvidence,
  stepLabel,
  STORY_REFERENCES,
  TOUR_PURPOSE,
  TOUR_STEPS,
  tourEvidence,
  TourEvidenceSchema,
  tryItHref,
  withTourParam,
  type LiveStep,
  type TourRecords,
} from './tour.ts';

const live = TOUR_STEPS.filter((step): step is LiveStep => step.kind === 'live');
const CONTRACTION = /\b\w+n't\b|\b(it's|that's|you're|we're|let's)\b/i;

function payment(id: string, reference: string, status: BusinessPayment['status'], at: string, invoiceId?: string): BusinessPayment {
  return {
    id,
    runId: at,
    instructionAt: at,
    at,
    intent: { payee: 'Naledi Mokoena', amount: '2', purpose: 'Logo', reference },
    status,
    reasons: status === 'not-approved' ? [PolicyReason.OverDailyLimit] : [],
    steps: [],
    hash: undefined,
    invoiceId,
  };
}

describe('tour steps', () => {
  it('has six steps: welcome, four live stories in order, then "Now you try"', () => {
    expect(TOUR_STEPS.map((step) => step.kind)).toEqual(['welcome', 'live', 'live', 'live', 'live', 'try']);
    expect(live.map((step) => step.scenario)).toEqual(['scenario-2', 'scenario-3', 'scenario-1', 'scenario-4']);
    expect(live.map((step) => step.title)).toEqual(SCENARIOS.map((scenario) => scenario.title));
    expect(stepLabel(1)).toBe('Step 2 of 6');
    expect(LAST_STEP).toBe(5);
  });

  it('says what will happen in two plain sentences, and who decided', () => {
    for (const step of live) {
      expect(step.intro).toHaveLength(2);
      for (const text of [...step.intro, step.decidedBy, TOUR_PURPOSE]) {
        expect(text).not.toMatch(CONTRACTION);
        expect(text).not.toMatch(/[\u2013\u2014]/);
      }
      expect(step.decidedBy).toMatch(/approval service|XRP Ledger|business/);
    }
  });

  it('pays the references the stories look for, so the evidence always matches the payout lists', () => {
    expect(VERIFIED_PAYOUT).toContain(STORY_REFERENCES.paid);
    expect(SPLIT_PAYOUTS).toContain(STORY_REFERENCES.split);
    expect(AFTER_REVOCATION_PAYOUT).toContain(STORY_REFERENCES.revoked);
  });

  it('ticks every one of the CFO\'s four questions with a live step', () => {
    expect(CFO_QUESTIONS).toHaveLength(4);
    for (const item of CFO_QUESTIONS) for (const step of item.steps) expect(TOUR_STEPS[step]?.kind).toBe('live');
  });
});

describe('the tour in the address', () => {
  it('reads the step, with "?tour" alone opening the welcome step', () => {
    expect(parseTourParam('')).toBe(0);
    expect(parseTourParam('3')).toBe(3);
    expect(parseTourParam(null)).toBeUndefined();
    expect(parseTourParam('9')).toBeUndefined();
    expect(parseTourParam('2x')).toBeUndefined();
  });

  it('sets or removes the step and keeps every other parameter', () => {
    expect(withTourParam('/business/payments?range=all&payment=1-A', 2)).toBe('/business/payments?range=all&payment=1-A&tour=2');
    expect(withTourParam('/business?tour=2', 3)).toBe('/business?tour=3');
    expect(withTourParam('/business?tour=2&x=1', undefined)).toBe('/business?x=1');
    expect(withTourParam('/business', undefined)).toBe('/business');
  });
});

describe('tour evidence', () => {
  const paidRun = '2026-11-12T10:00:00.000Z';
  const records: TourRecords = {
    payments: [
      payment('1-INV-1042', 'INV-1042', 'paid', paidRun, 'F1'),
      payment('2-INV-1042', 'INV-1042', 'paid', '2026-11-12T12:00:00.000Z', 'F2'),
      payment('3-INV-2001-C', 'INV-2001-C', 'not-approved', '2026-11-12T11:00:00.000Z', 'F3'),
    ],
    instructions: [] as Instruction[],
    desk: [
      { id: 'd-OLD', kind: 'deposit', at: paidRun, invoiceId: 'F1' },
      { id: 'd-NEW', kind: 'deposit', at: '2026-11-12T12:00:05.000Z', invoiceId: 'F2' },
      { id: 'x-A', kind: 'rejection', at: '2026-11-12T09:00:00.000Z', invoiceId: undefined },
      { id: 'x-B', kind: 'rejection', at: '2026-11-12T13:00:00.000Z', invoiceId: undefined },
    ],
    lastRuns: [{ kind: 'scenario-2', at: '2026-11-12T12:00:00.000Z', outcome: 'finished', summary: 'Paid.' }],
  };
  const [pays, splits, unknown, revokes] = live;

  it('opens the newest matching payment, and the same payment at the exchange, with their highlights', () => {
    const evidence = pays === undefined ? undefined : stepEvidence(pays, records);
    expect(evidence?.links.map((link) => link.href)).toEqual([
      '/business/payments?range=all&payment=2-INV-1042&highlight=decision&tour=1',
      '/exchange/payments?range=all&entry=d-NEW&highlight=travel-rule&tour=1',
    ]);
    expect(evidence?.latestRun).toMatchObject({ outcome: 'finished', when: '12 November 2026, 14:00 SAST' });
  });

  it('points each story at its own record', () => {
    expect(splits === undefined ? undefined : stepEvidence(splits, records).links[0]?.href).toContain('payment=3-INV-2001-C&highlight=decision');
    expect(unknown === undefined ? undefined : stepEvidence(unknown, records).links[0]?.href).toContain('entry=x-B&highlight=explorer');
    const revokedLinks = revokes === undefined ? [] : stepEvidence(revokes, records).links;
    expect(revokedLinks[0]?.href).toBe('/business/agent?highlight=agent-status&tour=4');
    // Never run yet: no link, so the panel says so instead of opening the wrong record.
    expect(revokedLinks[1]?.href).toBeUndefined();
    expect(unknown === undefined ? undefined : stepEvidence(unknown, records).thuso).toBeUndefined();
  });

  it('builds the data the browser receives, which passes its own schema', () => {
    const data = tourEvidence(records);
    expect(TourEvidenceSchema.parse(data)).toEqual(data);
    expect(Object.keys(data.steps)).toEqual(['1', '2', '3', '4']);
    expect(data.steps['1']?.latestRun?.summary).toBe('Paid.');
  });

  it('opens Give an instruction with the allowance highlighted', () => {
    expect(tryItHref(5)).toBe('/business/instruct?highlight=allowance&tour=5');
  });
});
