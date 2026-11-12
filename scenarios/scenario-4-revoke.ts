import { printLine, printStep } from '../src/cli/output.ts';
import { runScript } from '../src/cli/run.ts';
import { createDemoContext } from './lib/context.ts';
import { printAgentEvent, printDeposits, printRefusals, printRegistrySteps } from './lib/print.ts';
import { AFTER_REVOCATION_PAYOUT } from './payout-lists.ts';

await runScript('scenario:4 revoke', async (client) => {
  const ctx = createDemoContext(client);
  const startedAt = new Date().toISOString();

  printStep('The business revokes its agent with the business key');
  printRegistrySteps(await ctx.registry.revokeAgent(ctx.wallets.agent.address));

  printStep('The agent receives a new payout and tries to pay');
  printLine(AFTER_REVOCATION_PAYOUT);
  const results = await ctx.createAgent(printAgentEvent).run(AFTER_REVOCATION_PAYOUT);
  if (results[0]?.status !== 'refused') throw new Error('A revoked agent was not refused');

  printDeposits(await ctx.exchange.syncDeposits());
  printRefusals((await ctx.exchange.refusedAttempts()).filter((entry) => entry.at >= startedAt));
});
