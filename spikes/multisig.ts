import { AccountSetAsfFlags, LedgerEntry, type AccountSet, type SignerListSet } from 'xrpl';
import { signAsAgent } from './lib/agent.ts';
import { requireValidCredential } from './lib/credential.ts';
import { loadEnv } from './lib/env.ts';
import { getSignerList, requireAccountState } from './lib/ledger.ts';
import { accountLink, printLine, printStep } from './lib/output.ts';
import { requireDelivered, requireRlusd, rlusdPayment } from './lib/rlusd.ts';
import { runSpike } from './lib/run.ts';
import { signMulti, signSingle, submitAndConfirm, submitExpectingRejection } from './lib/submit.ts';
import { loadWallets } from './lib/wallets.ts';

const QUORUM = 2;
const PAYMENT_VALUE = '1';

await runSpike('multisig', async (client) => {
  const env = loadEnv();
  const wallets = loadWallets(env);
  const agent = wallets.agent.address;
  const signerAddresses = [wallets.agentSigner.address, wallets.policy.address];

  printStep('Agent account signer list: agent key and policy key, quorum 2');
  printLine(accountLink(agent));
  const existing = await getSignerList(client, agent);
  if (existing !== undefined) {
    const accounts = existing.SignerEntries.map(({ SignerEntry }) => SignerEntry.Account).sort();
    const matches = existing.SignerQuorum === QUORUM && accounts.join() === [...signerAddresses].sort().join();
    if (!matches) throw new Error('The agent already has a different signer list');
    printLine('signer list already in place');
  } else {
    const signerList: SignerListSet = {
      TransactionType: 'SignerListSet',
      Account: agent,
      SignerQuorum: QUORUM,
      SignerEntries: signerAddresses.map((address) => ({ SignerEntry: { Account: address, SignerWeight: 1 } })),
    };
    await submitAndConfirm(client, await signAsAgent(client, wallets, signerList, env.sourceTag));
  }

  printStep('Agent master key is disabled, so no single key can move funds');
  const { flags } = await requireAccountState(client, agent);
  if ((flags & LedgerEntry.AccountRootFlags.lsfDisableMaster) !== 0) {
    printLine('master key already disabled');
  } else {
    const disable: AccountSet = { TransactionType: 'AccountSet', Account: agent, SetFlag: AccountSetAsfFlags.asfDisableMaster };
    await submitAndConfirm(client, await signAsAgent(client, wallets, disable, env.sourceTag));
  }

  const credential = await requireValidCredential(client, wallets);
  await requireRlusd(client, agent, Number(PAYMENT_VALUE));
  const payment = rlusdPayment(agent, wallets.exchange.address, PAYMENT_VALUE, [credential.id]);

  printStep('RLUSD payment signed by the agent key and the policy key');
  const outcome = await submitAndConfirm(
    client,
    await signMulti(client, [wallets.agentSigner, wallets.policy], payment, env.sourceTag),
  );
  requireDelivered(outcome, PAYMENT_VALUE);

  printStep('Same payment signed by the agent key alone');
  await submitExpectingRejection(
    client,
    await signMulti(client, [wallets.agentSigner], payment, env.sourceTag),
    'tefBAD_QUORUM',
  );

  printStep('Same payment signed by the agent master key alone');
  await submitExpectingRejection(
    client,
    await signSingle(client, wallets.agent, payment, env.sourceTag),
    'tefMASTER_DISABLED',
  );
});
