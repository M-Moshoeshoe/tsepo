import { randomBytes } from 'node:crypto';
import { printLine, printStep } from '../src/cli/output.ts';
import { expectRejection } from '../src/cli/report.ts';
import { runScript } from '../src/cli/run.ts';
import { DEMO_PAYEES } from '../src/config/demo.ts';
import { rlusdPayment } from '../src/ledger/rlusd.ts';
import { prepareTransaction, signSingle } from '../src/ledger/submit.ts';
import { createDemoContext } from './lib/context.ts';
import { printDeposits, printRefusals } from './lib/print.ts';

await runScript('scenario:1 unknown agent', async (client) => {
  const ctx = createDemoContext(client);
  const startedAt = new Date().toISOString();
  const unknown = ctx.wallets.unknownAgent.address;
  const lane = ctx.wallets.exchange.address;
  const payment = rlusdPayment(unknown, lane, '2', {
    destinationTag: DEMO_PAYEES[0].destinationTag,
    invoiceId: randomBytes(32).toString('hex').toUpperCase(),
  });

  printStep('An agent nobody registered asks the policy service to co-sign 2 RLUSD to the agent lane');
  const prepared = await prepareTransaction(client, payment, { sourceTag: ctx.env.sourceTag, signersCount: 2 });
  const review = await ctx.policy.review({ payment: prepared, purpose: 'Consulting services' });
  printLine(review.decision === 'refused' ? `refused: ${review.reasons.join(', ')}` : 'signed (unexpected)');
  if (review.decision !== 'refused') throw new Error('The policy service signed for an unknown agent');

  printStep('It pays the agent lane directly with its own key');
  await expectRejection(client, await signSingle(client, ctx.wallets.unknownAgent, payment, ctx.env.sourceTag), 'tecNO_PERMISSION');

  printDeposits(await ctx.exchange.syncDeposits());
  printRefusals((await ctx.exchange.refusedAttempts()).filter((entry) => entry.at >= startedAt));
});
