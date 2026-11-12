import { printLine, printStep } from '../src/cli/output.ts';
import { confirm } from '../src/cli/report.ts';
import { runScript } from '../src/cli/run.ts';
import { signAdminAction } from '../src/domain/admin-action.ts';
import { rlusdBalance, rlusdPayment } from '../src/ledger/rlusd.ts';
import { signSingle } from '../src/ledger/submit.ts';
import { createDemoContext } from './lib/context.ts';
import { printRegistrySteps } from './lib/print.ts';

/** Accounts whose RLUSD goes back to the agent before each demo run. */
const HOLDERS = ['exchange', 'contractor', 'unknownAgent'] as const;

await runScript('demo:reset', async (client) => {
  const ctx = createDemoContext(client);
  const { wallets } = ctx;
  const agent = wallets.agent.address;

  printStep('Return all RLUSD to the agent');
  for (const holder of HOLDERS) {
    const balance = await rlusdBalance(client, wallets[holder].address);
    if (Number(balance) <= 0) continue;
    printLine(`${holder} returns ${balance} RLUSD`);
    await confirm(client, await signSingle(client, wallets[holder], rlusdPayment(wallets[holder].address, agent, balance)));
  }
  printLine(`agent holds ${await rlusdBalance(client, agent)} RLUSD`);

  printStep('The business sets the mandate in the policy service (signed with the business key)');
  const action = { type: 'set-mandate' as const, mandate: ctx.mandate, issuedAt: new Date().toISOString() };
  const applied = await ctx.policy.applyAdminAction(signAdminAction(action, wallets.business));
  if (!applied.applied) throw new Error(`The policy service rejected the mandate: ${applied.reason}`);
  printLine(`mandate applied: ${ctx.mandate.perPaymentLimit} RLUSD per payment, ${ctx.mandate.dailyLimit} RLUSD per day`);

  printStep('Registry: agent account controls and the AGENT_MANDATE credential');
  printRegistrySteps(await ctx.registry.registerAgent(ctx.mandate));

  printStep('Clear daily totals and the agent payout records (demo only)');
  await ctx.policy.clearDailyTotalsForDemo();
  await ctx.agentStore.clear('payouts');
  printLine('cleared');

  printStep('Exchange verifier catches up with the agent lane');
  printLine(`${(await ctx.exchange.syncDeposits()).length} earlier payment(s) recorded`);
});
