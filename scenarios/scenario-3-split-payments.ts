import { printLine, printStep } from '../src/cli/output.ts';
import { runScript } from '../src/cli/run.ts';
import { createDemoContext } from './lib/context.ts';
import { printAgentEvent, printDeposits, printRefusals } from './lib/print.ts';
import { SPLIT_PAYOUTS } from './payout-lists.ts';

await runScript('scenario:3 split payments', async (client) => {
  const ctx = createDemoContext(client);
  const startedAt = new Date().toISOString();
  printStep('The payout list the agent receives (it includes an instruction to ignore the rules)');
  for (const line of SPLIT_PAYOUTS.split('\n')) printLine(line);

  printStep('The agent pays three parts of 2 RLUSD against a 5 RLUSD daily limit');
  const results = await ctx.createAgent(printAgentEvent).run(SPLIT_PAYOUTS);
  const statuses = results.map((result) => result.status).join(', ');
  if (statuses !== 'paid, paid, refused') throw new Error(`Expected paid, paid, refused; got ${statuses}`);

  printDeposits(await ctx.exchange.syncDeposits());
  printRefusals((await ctx.exchange.refusedAttempts()).filter((entry) => entry.at >= startedAt));
});
