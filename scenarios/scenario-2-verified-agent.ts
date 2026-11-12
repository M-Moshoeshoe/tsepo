import { printLine, printStep } from '../src/cli/output.ts';
import { runScript } from '../src/cli/run.ts';
import { createDemoContext } from './lib/context.ts';
import { printAgentEvent, printDeposits } from './lib/print.ts';
import { VERIFIED_PAYOUT } from './payout-lists.ts';

await runScript('scenario:2 verified agent', async (client) => {
  const ctx = createDemoContext(client);
  printStep('The payout list the agent receives');
  printLine(VERIFIED_PAYOUT);

  printStep('The registered agent pays on its own');
  const results = await ctx.createAgent(printAgentEvent).run(VERIFIED_PAYOUT);
  if (results.length !== 1 || results[0]?.status !== 'paid') throw new Error('The verified payment did not go through');

  printDeposits(await ctx.exchange.syncDeposits());
});
