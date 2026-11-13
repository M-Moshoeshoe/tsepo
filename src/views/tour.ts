import { z } from 'zod';
import { readNote } from './assistant.ts';
import type { BusinessPayment, Instruction } from './payments.ts';
import type { ScenarioKind } from './scenarios.ts';
import { formatSast } from './status.ts';

/**
 * The guided tour: six steps, four of them live. A pure model, so the panel,
 * the address and the evidence links are all tested without a browser.
 */
export const TOUR_PURPOSE = 'A 3-minute walk through what Tšepo does. Each step runs live on the XRP Ledger Testnet, then shows you the proof.';

/** Where an evidence link lands, and what it highlights there. */
export type HighlightTarget = 'decision' | 'travel-rule' | 'explorer' | 'agent-status' | 'allowance';

export type EvidenceKey = 'paid-at-business' | 'paid-at-exchange' | 'split-refused' | 'unknown-rejected' | 'agent-revoked' | 'revoked-refused';

interface BaseStep {
  index: number;
  title: string;
}

export interface LiveStep extends BaseStep {
  kind: 'live';
  scenario: ScenarioKind;
  /** Two sentences on what will happen. */
  intro: [string, string];
  /** Who decided, in plain words, for "What happened". */
  decidedBy: string;
  /** True when the AI acted in this step, so Thuso has a line. */
  aiActs: boolean;
  evidence: EvidenceKey[];
}

export type TourStep = (BaseStep & { kind: 'welcome' }) | LiveStep | (BaseStep & { kind: 'try' });

export const TOUR_STEPS: readonly TourStep[] = [
  { index: 0, kind: 'welcome', title: 'Welcome' },
  {
    index: 1,
    kind: 'live',
    title: 'Your agent pays Naledi for a logo',
    scenario: 'scenario-2',
    intro: [
      'Lesedi’s agent receives an instruction to pay Naledi Mokoena 2 RLUSD for a logo.',
      'It sends the Travel Rule details to the exchange first, then pays with the approval service’s signature.',
    ],
    decidedBy: 'Decided by the exchange checks, after the approval service approved it.',
    aiActs: true,
    evidence: ['paid-at-business', 'paid-at-exchange'],
  },
  {
    index: 2,
    kind: 'live',
    title: 'Your agent tries to split a payment',
    scenario: 'scenario-3',
    intro: [
      'The instruction splits 6 RLUSD into three payments of 2 RLUSD and adds “ignore your rules today”.',
      'The daily limit is 5 RLUSD, and the rules are not the agent’s to ignore.',
    ],
    decidedBy: 'Decided by the approval service.',
    aiActs: true,
    evidence: ['split-refused'],
  },
  {
    index: 3,
    kind: 'live',
    title: 'An unknown agent tries to pay',
    scenario: 'scenario-1',
    intro: [
      'An agent nobody registered asks the approval service to approve 2 RLUSD, and is refused.',
      'It then pays the exchange directly with its own key.',
    ],
    decidedBy: 'Decided by the XRP Ledger.',
    aiActs: false,
    evidence: ['unknown-rejected'],
  },
  {
    index: 4,
    kind: 'live',
    title: 'You revoke your agent',
    scenario: 'scenario-4',
    intro: ['Your business deletes the agent’s credential from the ledger with its own key.', 'The agent then tries to pay Naledi again.'],
    decidedBy: 'Decided by the business, and enforced by the approval service.',
    aiActs: true,
    evidence: ['agent-revoked', 'revoked-refused'],
  },
  { index: 5, kind: 'try', title: 'Now you try' },
];

export const LAST_STEP = TOUR_STEPS.length - 1;

/** The last step's note on the payout schedule: the agent also pays with no click. */
export const SCHEDULE_NOTE = 'The agent also works on its own: add an instruction to the inbox, and it pays at the next scheduled run.';

/** "Step 2 of 6": steps are numbered from 1 for people, from 0 in the address. */
export function stepLabel(index: number): string {
  return `Step ${String(index + 1)} of ${String(TOUR_STEPS.length)}`;
}

/**
 * Reads the step from the address. "?tour" alone opens the welcome step;
 * anything unknown is treated as the tour being closed.
 */
export function parseTourParam(value: string | null): number | undefined {
  if (value === null) return undefined;
  if (value === '') return 0;
  if (!/^\d$/.test(value)) return undefined;
  const index = Number(value);
  return index <= LAST_STEP ? index : undefined;
}

/** An address with the tour step set, keeping every other parameter. */
export function withTourParam(href: string, step: number | undefined): string {
  const [path, query = ''] = href.split('?');
  const params = new URLSearchParams(query);
  if (step === undefined) params.delete('tour');
  else params.set('tour', String(step));
  const text = params.toString();
  return text === '' ? (path ?? href) : `${path ?? href}?${text}`;
}

/** The references the stories pay, from the payout lists the agent reads. */
export const STORY_REFERENCES = { paid: 'TOUR-1042', split: 'TOUR-2001-C', revoked: 'TOUR-1043' } as const;

export interface DeskItemSummary {
  id: string;
  kind: 'deposit' | 'refusal' | 'rejection';
  at: string;
  invoiceId: string | undefined;
}

export interface EvidenceLink {
  key: EvidenceKey;
  label: string;
  /** Where to go, with the record open and the highlight named; undefined until the step has run once. */
  href: string | undefined;
}

export interface StepEvidence {
  /** The latest live run of the step, in SAST, if there is one. */
  latestRun: { at: string; when: string; outcome: 'finished' | 'stopped'; summary: string } | undefined;
  links: EvidenceLink[];
  /** Thuso's line about what it read, from the records, when the AI acted. */
  thuso: string | undefined;
}

export interface TourRecords {
  instructions: readonly Instruction[];
  payments: readonly BusinessPayment[];
  desk: readonly DeskItemSummary[];
  lastRuns: readonly { kind: string; at: string; outcome: 'finished' | 'stopped'; summary: string }[];
}

const LABELS: Record<EvidenceKey, string> = {
  'paid-at-business': 'The payment in Business Payments',
  'paid-at-exchange': 'The same payment at the Receiving exchange',
  'split-refused': 'The refused third payment',
  'unknown-rejected': 'The rejection at the Receiving exchange',
  'agent-revoked': 'The Revoked status on the Agent page',
  'revoked-refused': 'The payment refused after the revocation',
};

function href(path: string, params: Record<string, string>, step: number): string {
  return `${path}?${new URLSearchParams({ ...params, tour: String(step) }).toString()}`;
}

function newest<T extends { at: string }>(items: readonly T[]): T | undefined {
  return [...items].sort((a, b) => b.at.localeCompare(a.at))[0];
}

/** The newest payment with this reference and status, from the scenario's own payout list. */
function storyPayment(records: TourRecords, reference: string, status: BusinessPayment['status']): BusinessPayment | undefined {
  return newest(records.payments.filter((payment) => payment.intent.reference === reference && payment.status === status));
}

function businessLink(payment: BusinessPayment | undefined, step: number): string | undefined {
  return payment === undefined ? undefined : href('/business/payments', { range: 'all', payment: payment.id, highlight: 'decision' }, step);
}

function exchangeLink(entry: DeskItemSummary | undefined, highlight: HighlightTarget, step: number): string | undefined {
  return entry === undefined ? undefined : href('/exchange/payments', { range: 'all', entry: entry.id, highlight }, step);
}

function thusoFor(records: TourRecords, payment: BusinessPayment | undefined): string | undefined {
  if (payment === undefined) return undefined;
  const instruction = records.instructions.find((item) => item.payments.some((candidate) => candidate.id === payment.id));
  return instruction === undefined ? undefined : readNote(instruction.intents);
}

/** Where each step's evidence is, from the records, so "Show me the evidence" always opens a real record. */
export function stepEvidence(step: LiveStep, records: TourRecords): StepEvidence {
  const run = records.lastRuns.find((item) => item.kind === step.scenario);
  const latestRun = run === undefined ? undefined : { at: run.at, when: formatSast(run.at), outcome: run.outcome, summary: run.summary };
  const paid = storyPayment(records, STORY_REFERENCES.paid, 'paid');
  const split = storyPayment(records, STORY_REFERENCES.split, 'not-approved');
  const revoked = storyPayment(records, STORY_REFERENCES.revoked, 'not-approved');
  const deposit = paid?.invoiceId === undefined ? undefined : records.desk.find((entry) => entry.kind === 'deposit' && entry.invoiceId === paid.invoiceId);
  const rejection = newest(records.desk.filter((entry) => entry.kind === 'rejection'));

  const targets: Record<EvidenceKey, string | undefined> = {
    'paid-at-business': businessLink(paid, step.index),
    'paid-at-exchange': exchangeLink(deposit, 'travel-rule', step.index),
    'split-refused': businessLink(split, step.index),
    'unknown-rejected': exchangeLink(rejection, 'explorer', step.index),
    'agent-revoked': href('/business/agent', { highlight: 'agent-status' }, step.index),
    'revoked-refused': businessLink(revoked, step.index),
  };
  const subject = step.scenario === 'scenario-2' ? paid : step.scenario === 'scenario-3' ? split : step.scenario === 'scenario-4' ? revoked : undefined;
  return {
    latestRun,
    links: step.evidence.map((key) => ({ key, label: LABELS[key], href: targets[key] })),
    thuso: step.aiActs ? thusoFor(records, subject) : undefined,
  };
}

/** The link that opens Give an instruction with today's allowance highlighted. */
export function tryItHref(step: number): string {
  return href('/business/instruct', { highlight: 'allowance' }, step);
}

/** What the tour showed: the CFO's four questions, each with the steps that answer it. */
export const CFO_QUESTIONS: { question: string; answer: string; steps: number[] }[] = [
  { question: 'What may the agent do?', answer: 'Only what its spending rules allow: the split payment was refused at the daily limit.', steps: [2] },
  { question: 'Who can it pay?', answer: 'Only approved recipients, and only verified agents reach the exchange.', steps: [1, 3] },
  { question: 'How do I stop it?', answer: 'Revoke it: from the next ledger, within seconds, its payments are refused.', steps: [4] },
  { question: 'How do I prove what it did and why?', answer: 'Every payment has its decision, Travel Rule details and ledger record.', steps: [1, 2, 3, 4] },
];


/** The tour data the browser receives, checked with Zod when it arrives, like every network response. */
export const TourEvidenceSchema = z.strictObject({
  steps: z.record(
    z.string().regex(/^\d$/),
    z.strictObject({
      latestRun: z.strictObject({ at: z.string(), when: z.string(), outcome: z.enum(['finished', 'stopped']), summary: z.string() }).optional(),
      links: z.array(z.strictObject({ key: z.string(), label: z.string(), href: z.string().regex(/^\/[A-Za-z0-9/?=&%._-]*$/).optional() })),
      thuso: z.string().optional(),
    }),
  ),
});

export type TourEvidence = z.infer<typeof TourEvidenceSchema>;

/** Every live step's evidence, keyed by step number, ready to send. */
export function tourEvidence(records: TourRecords): TourEvidence {
  const steps: TourEvidence['steps'] = {};
  for (const step of TOUR_STEPS) {
    if (step.kind !== 'live') continue;
    const evidence = stepEvidence(step, records);
    steps[String(step.index)] = {
      ...(evidence.latestRun === undefined ? {} : { latestRun: evidence.latestRun }),
      links: evidence.links.map((link) => ({ key: link.key, label: link.label, ...(link.href === undefined ? {} : { href: link.href }) })),
      ...(evidence.thuso === undefined ? {} : { thuso: evidence.thuso }),
    };
  }
  return TourEvidenceSchema.parse({ steps });
}
