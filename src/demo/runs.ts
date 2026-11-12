import { randomBytes } from 'node:crypto';
import type { Client } from 'xrpl';
import type { AgentEvent } from '../agent/payout-agent.ts';
import { DEMO_PAYEES } from '../config/demo.ts';
import { signAdminAction } from '../domain/admin-action.ts';
import type { Mandate } from '../domain/mandate.ts';
import type { DepositRecord } from '../exchange/exchange-verifier.ts';
import { agentCredentialQuery } from '../ledger/credential.ts';
import { findCredential } from '../ledger/reads.ts';
import { rlusdBalance, rlusdPayment } from '../ledger/rlusd.ts';
import { prepareTransaction, signSingle, submitAndConfirm, submitExpectingRejection } from '../ledger/submit.ts';
import type { RegistryStep } from '../registry/registry.ts';
import { depositStatus, reasonText, refusalStatus } from '../views/status.ts';
import { createDemoContext, type DemoContext } from './context.ts';
import type { Report, RunRequest } from './events.ts';
import { AFTER_REVOCATION_PAYOUT, SPLIT_PAYOUTS, VERIFIED_PAYOUT } from './payout-lists.ts';

/** Accounts whose RLUSD goes back to the agent on reset. */
const HOLDERS = ['exchange', 'contractor', 'unknownAgent'] as const;

function agentReporter(report: Report): (event: AgentEvent) => void {
  return (event) => {
    switch (event.type) {
      case 'parsed':
        report({ type: 'line', text: `Claude read ${event.intents.length} payment(s) from the instruction` });
        for (const intent of event.intents) {
          report({ type: 'line', text: `${intent.reference}: ${intent.amount} RLUSD to ${intent.payee} for ${intent.purpose}` });
        }
        break;
      case 'package-sent':
        report({ type: 'line', text: `${event.reference}: Directive 9 package sent to the exchange first` });
        break;
      case 'submitting':
        report({ type: 'line', text: `${event.reference}: co-signed by the policy service and submitted`, hash: event.hash });
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
  report({ type: 'step', text: 'The exchange reads the agent lane' });
  if (records.length === 0) report({ type: 'line', text: 'No new payment reached the agent lane' });
  for (const record of records) {
    report({ type: 'line', text: `${depositStatus(record).label}: ${record.amount ?? '0'} RLUSD`, hash: record.hash });
  }
}

async function reportRefusals(ctx: DemoContext, report: Report, since: string): Promise<void> {
  const refusals = (await ctx.exchange.refusedAttempts()).filter((entry) => entry.at >= since);
  for (const entry of refusals) {
    report({ type: 'line', text: `From the policy log: ${refusalStatus(entry.reasons).label}` });
  }
}

async function reset(ctx: DemoContext, report: Report): Promise<string> {
  const { client, wallets } = ctx;
  const agent = wallets.agent.address;
  const startedAt = new Date().toISOString();

  report({ type: 'step', text: 'Return all RLUSD to the agent' });
  for (const holder of HOLDERS) {
    const balance = await rlusdBalance(client, wallets[holder].address);
    if (Number(balance) <= 0) continue;
    report({ type: 'line', text: `${holder} returns ${balance} RLUSD` });
    const signed = await signSingle(client, wallets[holder], rlusdPayment(wallets[holder].address, agent, balance));
    const outcome = await submitAndConfirm(client, signed);
    report({ type: 'line', text: 'tesSUCCESS', hash: outcome.hash });
  }
  const agentBalance = await rlusdBalance(client, agent);

  report({ type: 'step', text: 'The business sets the demo mandate (signed with the business key)' });
  const action = { type: 'set-mandate' as const, mandate: ctx.mandate, issuedAt: new Date().toISOString() };
  const applied = await ctx.policy.applyAdminAction(signAdminAction(action, wallets.business));
  if (!applied.applied) throw new Error(`The policy service rejected the mandate: ${applied.reason}`);

  report({ type: 'step', text: 'The registry checks the agent account and its credential' });
  reportRegistrySteps(report, await ctx.registry.registerAgent(ctx.mandate));

  report({ type: 'step', text: 'Clear daily totals and payout records (demo only)' });
  await ctx.policy.clearDailyTotalsForDemo();
  await ctx.agentStore.clear('payouts');
  await ctx.exchange.syncDeposits();
  await ctx.demo.recordReset(startedAt);

  return `The demo is reset. The agent holds ${agentBalance} RLUSD; limits are ${ctx.mandate.perPaymentLimit} RLUSD per payment and ${ctx.mandate.dailyLimit} RLUSD per day.`;
}

async function unknownAgent(ctx: DemoContext, report: Report): Promise<string> {
  const { client, wallets } = ctx;
  const since = new Date().toISOString();
  const unknown = wallets.unknownAgent.address;
  const payment = rlusdPayment(unknown, wallets.exchange.address, '2', {
    destinationTag: DEMO_PAYEES[0].destinationTag,
    invoiceId: randomBytes(32).toString('hex').toUpperCase(),
  });

  report({ type: 'step', text: 'An agent nobody registered asks the policy service to co-sign 2 RLUSD' });
  const prepared = await prepareTransaction(client, payment, { sourceTag: ctx.env.sourceTag, signersCount: 2 });
  const review = await ctx.policy.review({ payment: prepared, purpose: 'Consulting services' });
  if (review.decision !== 'refused') throw new Error('The policy service signed for an unknown agent');
  report({ type: 'line', text: refusalStatus(review.reasons).label });

  report({ type: 'step', text: 'It pays the agent lane directly with its own key' });
  const signed = await signSingle(client, wallets.unknownAgent, payment, ctx.env.sourceTag);
  const result = await submitExpectingRejection(client, signed, 'tecNO_PERMISSION', (hash) => {
    report({ type: 'line', text: 'Submitting to the ledger', hash });
  });
  report({ type: 'line', text: `Rejected by the ledger with ${result}`, hash: signed.hash });
  await ctx.exchange.observeLedgerRejection(signed.hash);

  reportDeposits(report, await ctx.exchange.syncDeposits());
  await reportRefusals(ctx, report, since);
  return 'Scenario 1 finished: the policy service refused the unknown agent and the ledger rejected its payment with tecNO_PERMISSION.';
}

async function verifiedAgent(ctx: DemoContext, report: Report): Promise<string> {
  report({ type: 'step', text: 'The agent reads its instruction and pays on its own' });
  const results = await ctx.createAgent(agentReporter(report)).run(VERIFIED_PAYOUT);
  if (results.length !== 1 || results[0]?.status !== 'paid') throw new Error('The verified payment did not go through');
  reportDeposits(report, await ctx.exchange.syncDeposits());
  return 'Scenario 2 finished: the verified payment of 2 RLUSD was paid and cleared.';
}

async function splitPayments(ctx: DemoContext, report: Report): Promise<string> {
  const since = new Date().toISOString();
  report({ type: 'step', text: 'The agent reads three payments of 2 RLUSD against a 5 RLUSD daily limit' });
  const results = await ctx.createAgent(agentReporter(report)).run(SPLIT_PAYOUTS);
  const statuses = results.map((result) => result.status).join(', ');
  if (statuses !== 'paid, paid, refused') throw new Error(`Expected paid, paid, refused; got ${statuses}`);
  reportDeposits(report, await ctx.exchange.syncDeposits());
  await reportRefusals(ctx, report, since);
  return 'Scenario 3 finished: two payments cleared and the third was refused as a split payment.';
}

async function revokeAgent(ctx: DemoContext, report: Report): Promise<string> {
  report({ type: 'step', text: 'The business revokes its agent with the business key' });
  reportRegistrySteps(report, await ctx.registry.revokeAgent(ctx.wallets.agent.address));
  return 'The agent is revoked. Its credential is no longer on the ledger.';
}

async function revokeScenario(ctx: DemoContext, report: Report): Promise<string> {
  const since = new Date().toISOString();
  await revokeAgent(ctx, report);
  report({ type: 'step', text: 'The agent receives a new instruction and tries to pay' });
  const results = await ctx.createAgent(agentReporter(report)).run(AFTER_REVOCATION_PAYOUT);
  if (results[0]?.status !== 'refused') throw new Error('A revoked agent was not refused');
  reportDeposits(report, await ctx.exchange.syncDeposits());
  await reportRefusals(ctx, report, since);
  return 'Scenario 4 finished: the agent was revoked and its next payment was refused.';
}

async function changeLimits(
  ctx: DemoContext,
  report: Report,
  limits: { perPaymentLimit: string; dailyLimit: string },
): Promise<string> {
  const { client, wallets } = ctx;
  const current = await findCredential(client, agentCredentialQuery(wallets.agent.address, wallets.issuer.address));
  if (current === undefined) throw new Error('The agent is revoked. Reset the demo to register it again.');

  const mandate: Mandate = { ...((await ctx.policy.currentMandate(wallets.agent.address)) ?? ctx.mandate), ...limits };
  report({ type: 'step', text: 'The business signs the new limits with the business key' });
  const action = { type: 'set-mandate' as const, mandate, issuedAt: new Date().toISOString() };
  const applied = await ctx.policy.applyAdminAction(signAdminAction(action, wallets.business));
  if (!applied.applied) throw new Error(`The policy service rejected the new limits: ${applied.reason}`);
  report({ type: 'line', text: 'The policy service accepted the business signature' });

  report({ type: 'step', text: 'The registry re-issues the credential for the new mandate' });
  reportRegistrySteps(report, await ctx.registry.issueCredential(mandate));
  return `Limits changed to ${limits.perPaymentLimit} RLUSD per payment and ${limits.dailyLimit} RLUSD per day. The credential now proves the new mandate.`;
}

/** Runs one demo action against Testnet, reporting progress. Throws on any failure; nothing is retried. */
export async function runDemo(request: RunRequest, client: Client, report: Report): Promise<void> {
  const ctx = createDemoContext(client, report);
  let summary: string;
  switch (request.kind) {
    case 'reset':
      summary = await reset(ctx, report);
      break;
    case 'scenario-1':
      summary = await unknownAgent(ctx, report);
      break;
    case 'scenario-2':
      summary = await verifiedAgent(ctx, report);
      break;
    case 'scenario-3':
      summary = await splitPayments(ctx, report);
      break;
    case 'scenario-4':
      summary = await revokeScenario(ctx, report);
      break;
    case 'revoke':
      summary = await revokeAgent(ctx, report);
      break;
    case 'change-limits':
      summary = await changeLimits(ctx, report, request);
      break;
  }
  report({ type: 'done', text: summary });
}
