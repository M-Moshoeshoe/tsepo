import type { CredentialDelete } from 'xrpl';
import { signAsAgent } from './lib/agent.ts';
import { agentCredentialQuery, CREDENTIAL_TYPE_HEX } from './lib/credential.ts';
import { loadEnv } from './lib/env.ts';
import { findCredential } from './lib/ledger.ts';
import { printLine, printStep } from './lib/output.ts';
import { requireRlusd, rlusdPayment } from './lib/rlusd.ts';
import { runSpike } from './lib/run.ts';
import { signSingle, submitAndConfirm, submitExpectingRejection } from './lib/submit.ts';
import { loadWallets } from './lib/wallets.ts';

const PAYMENT_VALUE = '1';

await runSpike('revoke', async (client) => {
  const env = loadEnv();
  const wallets = loadWallets(env);
  const query = agentCredentialQuery(wallets);

  printStep('Issuer deletes the AGENT_MANDATE credential');
  const revoked = await findCredential(client, query);
  if (revoked === undefined) throw new Error('There is no credential to revoke. Run npm run spike:credential first.');
  const remove: CredentialDelete = {
    TransactionType: 'CredentialDelete',
    Account: wallets.issuer.address,
    Subject: wallets.agent.address,
    CredentialType: CREDENTIAL_TYPE_HEX,
  };
  await submitAndConfirm(client, await signSingle(client, wallets.issuer, remove));
  if ((await findCredential(client, query)) !== undefined) throw new Error('The credential is still on the ledger');
  printLine('credential no longer on the ledger');

  printStep('Agent pays the agent lane again, presenting the revoked credential');
  await requireRlusd(client, wallets.agent.address, Number(PAYMENT_VALUE));
  const payment = rlusdPayment(wallets.agent.address, wallets.exchange.address, PAYMENT_VALUE, [revoked.id]);
  await submitExpectingRejection(
    client,
    await signAsAgent(client, wallets, payment, env.sourceTag),
    'tecBAD_CREDENTIALS',
  );
});
