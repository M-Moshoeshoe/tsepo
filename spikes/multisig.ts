import { AccountSetAsfFlags, LedgerEntry, type AccountSet } from 'xrpl';
import { ensureAgentSignerList, signAsAgent } from './lib/agent.ts';
import { requireValidCredential } from './lib/credential.ts';
import { loadEnv } from '../src/config/env.ts';
import { requireAccountState } from '../src/ledger/reads.ts';
import { accountLink, printLine, printStep } from '../src/cli/output.ts';
import { requireDelivered, requireRlusd, rlusdPayment } from '../src/ledger/rlusd.ts';
import { runScript } from '../src/cli/run.ts';
import { confirm, expectRejection } from '../src/cli/report.ts';
import { signMulti, signSingle } from '../src/ledger/submit.ts';
import { loadWallets } from '../src/config/wallets.ts';

const PAYMENT_VALUE = '1';

await runScript('spike:multisig', async (client) => {
  const env = loadEnv();
  const wallets = loadWallets(env);
  const agent = wallets.agent.address;

  printStep('Agent account signer list: business key 2, agent key 1, policy key 1, quorum 2');
  printLine(accountLink(agent));
  await ensureAgentSignerList(client, wallets, env.sourceTag);

  printStep('Agent master key is disabled, so no single key can move funds');
  const { flags } = await requireAccountState(client, agent);
  if ((flags & LedgerEntry.AccountRootFlags.lsfDisableMaster) !== 0) {
    printLine('master key already disabled');
  } else {
    const disable: AccountSet = { TransactionType: 'AccountSet', Account: agent, SetFlag: AccountSetAsfFlags.asfDisableMaster };
    await confirm(client, await signAsAgent(client, wallets, disable, env.sourceTag));
  }

  const credential = await requireValidCredential(client, wallets);
  await requireRlusd(client, agent, Number(PAYMENT_VALUE));
  const payment = rlusdPayment(agent, wallets.exchange.address, PAYMENT_VALUE, { credentialIds: [credential.id] });

  printStep('RLUSD payment signed by the agent key and the policy key');
  const outcome = await confirm(
    client,
    await signMulti(client, [wallets.agentSigner, wallets.policy], payment, env.sourceTag),
  );
  requireDelivered(outcome, PAYMENT_VALUE);

  printStep('Same payment signed by the agent key alone');
  await expectRejection(
    client,
    await signMulti(client, [wallets.agentSigner], payment, env.sourceTag),
    'tefBAD_QUORUM',
  );

  printStep('Same payment signed by the agent master key alone');
  await expectRejection(
    client,
    await signSingle(client, wallets.agent, payment, env.sourceTag),
    'tefMASTER_DISABLED',
  );
});
