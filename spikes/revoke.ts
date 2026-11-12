import type { CredentialDelete } from 'xrpl';
import { signAsAgent } from './lib/agent.ts';
import { agentCredentialQuery, CREDENTIAL_TYPE_HEX } from './lib/credential.ts';
import { loadEnv } from '../src/config/env.ts';
import { findCredential } from '../src/ledger/reads.ts';
import { printLine, printStep } from '../src/cli/output.ts';
import { requireRlusd, rlusdPayment } from '../src/ledger/rlusd.ts';
import { runScript } from '../src/cli/run.ts';
import { confirm, expectRejection } from '../src/cli/report.ts';
import { signSingle } from '../src/ledger/submit.ts';
import { loadWallets } from '../src/config/wallets.ts';

const PAYMENT_VALUE = '1';

await runScript('spike:revoke', async (client) => {
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
  await confirm(client, await signSingle(client, wallets.issuer, remove));
  if ((await findCredential(client, query)) !== undefined) throw new Error('The credential is still on the ledger');
  printLine('credential no longer on the ledger');

  printStep('Agent pays the agent lane again, presenting the revoked credential');
  await requireRlusd(client, wallets.agent.address, Number(PAYMENT_VALUE));
  const payment = rlusdPayment(wallets.agent.address, wallets.exchange.address, PAYMENT_VALUE, { credentialIds: [revoked.id] });
  await expectRejection(
    client,
    await signAsAgent(client, wallets, payment, env.sourceTag),
    'tecBAD_CREDENTIALS',
  );
});
