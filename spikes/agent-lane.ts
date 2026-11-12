import { AccountSetAsfFlags, LedgerEntry, type AccountSet, type DepositPreauth } from 'xrpl';
import { signAsAgent } from './lib/agent.ts';
import { CREDENTIAL_TYPE_HEX, requireValidCredential } from './lib/credential.ts';
import { loadEnv } from '../src/config/env.ts';
import { hasCredentialPreauth, requireAccountState } from '../src/ledger/reads.ts';
import { accountLink, printLine, printStep } from '../src/cli/output.ts';
import { requireDelivered, requireRlusd, rlusdPayment } from '../src/ledger/rlusd.ts';
import { runScript } from '../src/cli/run.ts';
import { confirm, expectRejection } from '../src/cli/report.ts';
import { signSingle } from '../src/ledger/submit.ts';
import { loadWallets } from '../src/config/wallets.ts';

const PAYMENT_VALUE = '1';

await runScript('spike:agent-lane', async (client) => {
  const env = loadEnv();
  const wallets = loadWallets(env);
  const exchange = wallets.exchange.address;

  printStep('Exchange agent lane enables Deposit Authorization');
  printLine(accountLink(exchange));
  const { flags } = await requireAccountState(client, exchange);
  if ((flags & LedgerEntry.AccountRootFlags.lsfDepositAuth) !== 0) {
    printLine('Deposit Authorization already enabled');
  } else {
    const enable: AccountSet = {
      TransactionType: 'AccountSet',
      Account: exchange,
      SetFlag: AccountSetAsfFlags.asfDepositAuth,
    };
    await confirm(client, await signSingle(client, wallets.exchange, enable));
  }

  printStep('Exchange preauthorises AGENT_MANDATE credentials from the Tšepo issuer');
  const preauthQuery = { owner: exchange, issuer: wallets.issuer.address, credentialTypeHex: CREDENTIAL_TYPE_HEX };
  if (await hasCredentialPreauth(client, preauthQuery)) {
    printLine('preauthorisation already in place');
  } else {
    const preauth: DepositPreauth = {
      TransactionType: 'DepositPreauth',
      Account: exchange,
      AuthorizeCredentials: [{ Credential: { Issuer: wallets.issuer.address, CredentialType: CREDENTIAL_TYPE_HEX } }],
    };
    await confirm(client, await signSingle(client, wallets.exchange, preauth));
  }

  printStep('Credentialed agent pays the agent lane, presenting its credential');
  const credential = await requireValidCredential(client, wallets);
  await requireRlusd(client, wallets.agent.address, Number(PAYMENT_VALUE));
  const payment = rlusdPayment(wallets.agent.address, exchange, PAYMENT_VALUE, { credentialIds: [credential.id] });
  const outcome = await confirm(client, await signAsAgent(client, wallets, payment, env.sourceTag));
  requireDelivered(outcome, PAYMENT_VALUE);

  printStep('An account with no credential pays the agent lane');
  await requireRlusd(client, wallets.contractor.address, Number(PAYMENT_VALUE));
  const uncredentialed = rlusdPayment(wallets.contractor.address, exchange, PAYMENT_VALUE);
  await expectRejection(
    client,
    await signSingle(client, wallets.contractor, uncredentialed),
    'tecNO_PERMISSION',
  );
});
