import { randomBytes } from 'node:crypto';
import type { Client } from 'xrpl';
import type { AgentEvent, PayoutResult } from '../agent/payout-agent.ts';
import { DEMO_PAYEES } from '../config/demo.ts';
import { signAdminAction } from '../domain/admin-action.ts';
import { withLimits, type MandateLimits } from '../domain/mandate.ts';
import { AgentReason, PolicyReason } from '../domain/reasons.ts';
import type { DepositRecord } from '../exchange/exchange-verifier.ts';
import { agentCredentialQuery } from '../ledger/credential.ts';
import { findCredential } from '../ledger/reads.ts';
import { rlusdBalance, rlusdPayment } from '../ledger/rlusd.ts';
import { prepareTransaction, signSingle, submitExpectingRejection } from '../ledger/submit.ts';
import type { RegistryStep } from '../registry/registry.ts';
import { depositStatus, reasonText, refusalStatus } from '../views/status.ts';
import { createDemoContext, type DemoContext } from './context.ts';
import { DemoError, ledgerResultSentence, plainRunError } from './errors.ts';
import type { Explanation, Report, RunRequest } from './events.ts';
import { AFTER_REVOCATION_PAYOUT, SPLIT_PAYOUTS, VERIFIED_PAYOUT } from './payout-lists.ts';
import { applyDemoMandate, prepareScenario, returnRlusdToAgent } from './prepare.ts';

interface RunOutcome {
  summary: string;
  /** Scenarios explain what they showed; maintenance actions such as reset do not. */
  explanation?: Explanation;
}

function payments(count: number): string {
  return count === 1 ? '1 payment' : `${String(count)} payments`;
}

function agentReporter(report: Report): (event: AgentEvent) => void {
  return (event) => {
    switch (event.type) {
      case 'parsed':
        report({ type: 'line', text: `Claude read ${payments(event.intents.length)} from the instruction` });
        for (const intent of event.intents) {
          report({ type: 'line', text: `${intent.reference}: ${intent.amount} RLUSD to ${intent.payee} for ${intent.purpose}` });
        }
        break;
      case 'package-sent':
        report({ type: 'line', text: `${event.reference}: Travel Rule details sent to the exchange first` });
        break;
      case 'submitting':
        report({ type: 'line', text: `${event.reference}: approved by the approval service and submitted`, hash: event.hash });
        break;
      case 'result': {
        const { result } = event;
        if (result.status === 'paid') {
          report({ type: 'line', text: `${result.reference}: paid, tesSUCCESS`, hash: result.hash });
        } else {
          report({ type: 'line', text: `${result.reference}: ${result.status}, ${result.reasons.map(reasonText).join('; ')}` });
        }
        break;
      }
    }
  };
}

function reportRegistrySteps(report: Report, steps: RegistryStep[]): void {
  for (const step of steps) {
    report({ type: 'line', text: step.hash === undefined ? step.action : `${step.action}: tesSUCCESS`, hash: step.hash });
  }
}

function reportDeposits(report: Report, records: DepositRecord[]): void {
  report({ type: 'step', text: 'The exchange reads its agent deposit address' });
  if (records.length === 0) report({ type: 'line', text: 'No new payment reached the agent deposit address' });
  for (const record of records) {
    report({ type: 'line', text: `${depositStatus(record).label}: ${record.amount ?? '0'} RLUSD`, hash: record.hash });
  }
}

async function reportRefusals(ctx: DemoContext, report: Report, since: string): Promise<void> {
  const refusals = (await ctx.exchange.refusedAttempts()).filter((entry) => entry.at >= since);
  for (const entry of refusals) {
    report({ type: 'line', text: `From the approval service log: ${refusalStatus(entry.reasons).label}` });
  }
}

/**
 * The error for a scenario whose payments did not end as the scenario
 * expects, in a plain sentence. The full results stay in `cause` for the log.
 */
function unexpectedResults(results: PayoutResult[], expected: PayoutResult['status'][]): DemoError {
  const index = expected.findIndex((status, position) => results[position]?.status !== status);
  const result = index === -1 ? undefined : results[index];
  const cause = { results, expected };
  if (result === undefined) {
    return new DemoError('Claude read a different number of payments than this story expects, so the run stopped.', { cause });
  }
  const ref = result.reference;
  switch (result.status) {
    case 'paid':
      return new DemoError(`The approval service approved ${ref}, which this story expected it to refuse.`, { cause });
    case 'refused':
      if (result.reasons.includes(PolicyReason.OverDailyLimit) || result.reasons.includes(PolicyReason.SplitPaymentPattern)) {
        return new DemoError(`Today's daily limit was already used, so the approval service refused ${ref}. Restore the sample data and try again.`, {
          cause,
        });
      }
      return new DemoError(`The approval service refused ${ref}: ${reasonText(result.reasons[0] ?? '')}.`, { cause });
    case 'skipped':
      return new DemoError(
        result.reasons.includes(AgentReason.AlreadyPaid)
          ? `${ref} was already paid, so the agent did not pay it again.`
          : `An earlier attempt to pay ${ref} is not resolved yet, so the agent did not pay it again.`,
        { cause },
      );
    case 'failed': {
      const code = result.reasons.find((reason) => /^te[cfm][A-Z_]+$/.test(reason));
      return new DemoError(code === undefined ? `The payment ${ref} could not be completed.` : ledgerResultSentence(code), { cause });
    }
  }
}

/** Stops the run, in plain words, unless the payments ended exactly as the scenario expects. */
function expectStatuses(results: PayoutResult[], expected: PayoutResult['status'][]): void {
  const matches = results.length === expected.length && expected.every((status, index) => results[index]?.status === status);
  if (!matches) throw unexpectedResults(results, expected);
}

async function reset(ctx: DemoContext, report: Report): Promise<RunOutcome> {
  const startedAt = new Date().toISOString();

  report({ type: 'step', text: 'Return all RLUSD to the agent' });
  await returnRlusdToAgent(ctx, report);
  const agentBalance = await rlusdBalance(ctx.client, ctx.wallets.agent.address);

  report({ type: 'step', text: 'The business sets the sample spending rules (signed with the business key)' });
  await applyDemoMandate(ctx);

  report({ type: 'step', text: 'Tšepo checks the agent account and its credential' });
  reportRegistrySteps(report, await ctx.registry.registerAgent(ctx.mandate));

  report({ type: 'step', text: 'Clear daily totals and payment records (sample workspace only)' });
  await ctx.policy.clearDailyTotalsForDemo();
  await ctx.agentStore.clear('payouts');
  await ctx.exchange.syncDeposits();
  await ctx.demo.recordReset(startedAt);

  return {
    summary: `The sample data is restored. The agent holds ${agentBalance} RLUSD; limits are ${ctx.mandate.perPaymentLimit} RLUSD per payment and ${ctx.mandate.dailyLimit} RLUSD per day.`,
  };
}

async function unknownAgent(ctx: DemoContext, report: Report): Promise<RunOutcome> {
  const { client, wallets } = ctx;
  const since = new Date().toISOString();
  const unknown = wallets.unknownAgent.address;
  const payment = rlusdPayment(unknown, wallets.exchange.address, '2', {
    destinationTag: DEMO_PAYEES[0].destinationTag,
    invoiceId: randomBytes(32).toString('hex').toUpperCase(),
  });

  await prepareScenario(ctx, report, { rlusd: '0', agent: false });
  report({ type: 'step', text: 'An agent nobody registered asks the approval service to approve 2 RLUSD' });
  const prepared = await prepareTransaction(client, payment, { sourceTag: ctx.env.sourceTag, signersCount: 2 });
  const review = await ctx.policy.review({ payment: prepared, purpose: 'Consulting services' });
  if (review.decision !== 'refused') throw new DemoError('The approval service approved an unregistered agent, so the run stopped.');
  report({ type: 'line', text: refusalStatus(review.reasons).label });

  report({ type: 'step', text: 'It pays the agent deposit address directly with its own key' });
  const signed = await signSingle(client, wallets.unknownAgent, payment, ctx.env.sourceTag);
  const result = await submitExpectingRejection(client, signed, 'tecNO_PERMISSION', (hash) => {
    report({ type: 'line', text: 'Submitting to the ledger', hash });
  });
  report({ type: 'line', text: `Rejected by the ledger with ${result}` });
  await ctx.exchange.observeLedgerRejection(signed.hash);

  reportDeposits(report, await ctx.exchange.syncDeposits());
  await reportRefusals(ctx, report, since);
  return {
    summary: 'The approval service refused the unknown agent, and the XRP Ledger rejected its payment with tecNO_PERMISSION.',
    explanation: {
      sentences: [
        'An agent nobody registered asked the approval service to approve 2 RLUSD, and the approval service refused because the agent has no spending rules.',
        'It then paid the agent deposit address directly with its own key, and the XRP Ledger rejected the payment with tecNO_PERMISSION because it holds no credential.',
      ],
      decidedBy: 'ledger',
      evidence: { label: 'The rejected payment on the ledger', hash: signed.hash },
    },
  };
}

async function verifiedAgent(ctx: DemoContext, report: Report): Promise<RunOutcome> {
  await prepareScenario(ctx, report, { rlusd: '2', agent: true });
  report({ type: 'step', text: 'The agent reads its instruction and pays on its own' });
  const results = await ctx.createAgent(agentReporter(report)).run(VERIFIED_PAYOUT);
  const paid = results[0];
  if (results.length !== 1 || paid?.status !== 'paid') throw unexpectedResults(results, ['paid']);
  reportDeposits(report, await ctx.exchange.syncDeposits());
  return {
    summary: 'The verified agent paid 2 RLUSD, and the exchange accepted it.',
    explanation: {
      sentences: [
        'The agent read the instruction, sent the Travel Rule details to the exchange first, and paid 2 RLUSD with the approval service signing too.',
        'The exchange accepted the payment because its credential, Travel Rule details and amount all matched.',
      ],
      decidedBy: 'exchange',
      evidence: { label: 'The cleared payment on the ledger', hash: paid.hash },
    },
  };
}

async function splitPayments(ctx: DemoContext, report: Report): Promise<RunOutcome> {
  await prepareScenario(ctx, report, { rlusd: '4', agent: true });
  const since = new Date().toISOString();
  report({ type: 'step', text: 'The agent reads three payments of 2 RLUSD against a 5 RLUSD daily limit' });
  const results = await ctx.createAgent(agentReporter(report)).run(SPLIT_PAYOUTS);
  expectStatuses(results, ['paid', 'paid', 'refused']);
  reportDeposits(report, await ctx.exchange.syncDeposits());
  await reportRefusals(ctx, report, since);
  return {
    summary: 'Two payments were accepted and the third was refused as a split payment.',
    explanation: {
      sentences: [
        'The first two payments of 2 RLUSD were approved and accepted, which used 4 of the 5 RLUSD daily limit.',
        'The third would have taken the day to 6 RLUSD, so the approval service refused it and nothing reached the ledger.',
      ],
      decidedBy: 'policy',
      evidence: { label: 'The refusal in the exchange workspace', path: '/exchange/payments?filter=refused' },
    },
  };
}

async function revokeAgent(ctx: DemoContext, report: Report): Promise<{ summary: string; hash: string | undefined }> {
  report({ type: 'step', text: 'The business revokes its agent with the business key' });
  const steps = await ctx.registry.revokeAgent(ctx.wallets.agent.address);
  reportRegistrySteps(report, steps);
  return {
    summary: 'The agent is revoked. Its credential is no longer on the ledger.',
    hash: steps.find((step) => step.hash !== undefined)?.hash,
  };
}

async function revokeScenario(ctx: DemoContext, report: Report): Promise<RunOutcome> {
  await prepareScenario(ctx, report, { rlusd: '0', agent: true });
  const since = new Date().toISOString();
  const revoked = await revokeAgent(ctx, report);
  report({ type: 'step', text: 'The agent receives a new instruction and tries to pay' });
  const results = await ctx.createAgent(agentReporter(report)).run(AFTER_REVOCATION_PAYOUT);
  expectStatuses(results, ['refused']);
  reportDeposits(report, await ctx.exchange.syncDeposits());
  await reportRefusals(ctx, report, since);
  return {
    summary: 'The agent was revoked, and its next payment was refused.',
    explanation: {
      sentences: [
        'The business deleted the agent credential from the ledger with its own key, which took effect from the next ledger, within seconds.',
        'When the agent tried to pay again, the approval service read the ledger, found no credential, and refused to approve.',
      ],
      decidedBy: 'policy',
      evidence:
        revoked.hash === undefined
          ? { label: 'The refusal in the exchange workspace', path: '/exchange/payments?filter=refused' }
          : { label: 'The revocation on the ledger', hash: revoked.hash },
    },
  };
}

async function changeLimits(ctx: DemoContext, report: Report, limits: MandateLimits): Promise<RunOutcome> {
  const { client, wallets } = ctx;
  const current = await findCredential(client, agentCredentialQuery(wallets.agent.address, wallets.issuer.address));
  if (current === undefined) throw new DemoError('The agent is revoked. Restore the sample data to register it again.');

  const mandate = withLimits((await ctx.policy.currentMandate(wallets.agent.address)) ?? ctx.mandate, limits);
  report({ type: 'step', text: 'The business signs the new limits with the business key' });
  const action = { type: 'set-mandate' as const, mandate, issuedAt: new Date().toISOString() };
  const applied = await ctx.policy.applyAdminAction(signAdminAction(action, wallets.business));
  if (!applied.applied) throw new DemoError(`The approval service did not accept the new limits: ${reasonText(applied.reason)}.`);
  report({ type: 'line', text: 'The approval service accepted the business signature' });

  report({ type: 'step', text: 'Tšepo issues a new credential for the new spending rules' });
  reportRegistrySteps(report, await ctx.registry.issueCredential(mandate));
  return {
    summary: `Limits changed to ${limits.perPaymentLimit} RLUSD per payment and ${limits.dailyLimit} RLUSD per day. The credential now proves the new spending rules.`,
  };
}

/** Reads the agent lane once more, so a stopped run still records every payment that reached the ledger. */
async function syncAfterRun(ctx: DemoContext): Promise<void> {
  try {
    await ctx.exchange.syncDeposits();
  } catch (error: unknown) {
    console.error('[runs] could not read the agent lane after the run', error);
  }
}

/**
 * Runs one demo action against Testnet, reporting progress. Throws on any
 * failure; nothing is retried. `createContext` is replaced only in tests.
 */
export async function runDemo(
  request: RunRequest,
  client: Client,
  report: Report,
  createContext: (client: Client, report: Report) => DemoContext = createDemoContext,
): Promise<void> {
  const ctx = createContext(client, report);
  const startedAt = new Date().toISOString();
  const isScenario = request.kind.startsWith('scenario-');
  let outcome: RunOutcome;
  try {
    outcome = await dispatch(ctx, request, report);
  } catch (error: unknown) {
    if (isScenario) await ctx.demo.recordRun({ kind: request.kind, at: startedAt, outcome: 'stopped', summary: plainRunError(error) });
    throw error;
  } finally {
    await syncAfterRun(ctx);
  }
  if (isScenario) await ctx.demo.recordRun({ kind: request.kind, at: startedAt, outcome: 'finished', summary: outcome.summary });
  report({ type: 'done', text: outcome.summary, explanation: outcome.explanation });
}

async function dispatch(ctx: DemoContext, request: RunRequest, report: Report): Promise<RunOutcome> {
  let outcome: RunOutcome;
  switch (request.kind) {
    case 'reset':
      outcome = await reset(ctx, report);
      break;
    case 'scenario-1':
      outcome = await unknownAgent(ctx, report);
      break;
    case 'scenario-2':
      outcome = await verifiedAgent(ctx, report);
      break;
    case 'scenario-3':
      outcome = await splitPayments(ctx, report);
      break;
    case 'scenario-4':
      outcome = await revokeScenario(ctx, report);
      break;
    case 'revoke':
      outcome = { summary: (await revokeAgent(ctx, report)).summary };
      break;
    case 'change-limits':
      outcome = await changeLimits(ctx, report, { perPaymentLimit: request.perPaymentLimit, dailyLimit: request.dailyLimit });
      break;
  }
  return outcome;
}
