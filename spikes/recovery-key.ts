import { LedgerEntry, type AccountSet } from 'xrpl';
import { accountLink, printLine, printStep } from '../src/cli/output.ts';
import { confirm, expectRejection } from '../src/cli/report.ts';
import { runScript } from '../src/cli/run.ts';
import { loadEnv } from '../src/config/env.ts';
import { loadWallets } from '../src/config/wallets.ts';
import { requireAccountState } from '../src/ledger/reads.ts';
import { signMulti } from '../src/ledger/submit.ts';
import { ensureAgentSignerList } from './lib/agent.ts';

await runScript('spike:recovery-key', async (client) => {
  const env = loadEnv();
  const wallets = loadWallets(env);
  const agent = wallets.agent.address;

  printStep('Agent signer list gains the business recovery key: business 2, agent 1, policy 1, quorum 2');
  printLine(accountLink(agent));
  await ensureAgentSignerList(client, wallets, env.sourceTag);

  printStep('The agent master key stays disabled');
  const { flags } = await requireAccountState(client, agent);
  if ((flags & LedgerEntry.AccountRootFlags.lsfDisableMaster) === 0) throw new Error('The agent master key is enabled');
  printLine('master key disabled');

  // An AccountSet with no changes: it proves who can sign for the account and changes nothing.
  const noChange: AccountSet = { TransactionType: 'AccountSet', Account: agent };

  printStep('The business key alone can administer the agent account');
  await confirm(client, await signMulti(client, [wallets.business], noChange));

  printStep('The agent key alone cannot');
  await expectRejection(client, await signMulti(client, [wallets.agentSigner], noChange), 'tefBAD_QUORUM');

  printStep('The policy key alone cannot');
  await expectRejection(client, await signMulti(client, [wallets.policy], noChange), 'tefBAD_QUORUM');
});
