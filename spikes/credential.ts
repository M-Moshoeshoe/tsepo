import { convertStringToHex, isoTimeToRippleTime, type CredentialAccept, type CredentialCreate } from 'xrpl';
import { isAccepted } from '../src/domain/credential-check.ts';
import { mandateFingerprint } from '../src/domain/fingerprint.ts';
import { signAsAgent } from './lib/agent.ts';
import { agentCredentialQuery, CREDENTIAL_TYPE_HEX, requireValidCredential } from './lib/credential.ts';
import { loadEnv } from '../src/config/env.ts';
import { findCredential } from '../src/ledger/reads.ts';
import { demoMandate } from '../src/config/demo.ts';
import { printLine, printStep } from '../src/cli/output.ts';
import { runScript } from '../src/cli/run.ts';
import { confirm } from '../src/cli/report.ts';
import { signSingle } from '../src/ledger/submit.ts';
import { loadWallets } from '../src/config/wallets.ts';

await runScript('spike:credential', async (client) => {
  const env = loadEnv();
  const wallets = loadWallets(env);
  const mandate = demoMandate(wallets);
  const fingerprint = mandateFingerprint(mandate);
  const query = agentCredentialQuery(wallets);

  printStep('Mandate fingerprint (the only mandate data on the ledger)');
  printLine(fingerprint);

  printStep('Issuer creates the AGENT_MANDATE credential');
  if ((await findCredential(client, query)) !== undefined) {
    printLine('credential already exists');
  } else {
    const create: CredentialCreate = {
      TransactionType: 'CredentialCreate',
      Account: wallets.issuer.address,
      Subject: wallets.agent.address,
      CredentialType: CREDENTIAL_TYPE_HEX,
      Expiration: isoTimeToRippleTime(mandate.expiresAt),
      URI: convertStringToHex(fingerprint),
    };
    await confirm(client, await signSingle(client, wallets.issuer, create));
  }

  printStep('Agent accepts the credential');
  const created = await findCredential(client, query);
  if (created === undefined) throw new Error('The credential is missing after creation');
  if (isAccepted(created.entry.flags)) {
    printLine('credential already accepted');
  } else {
    const accept: CredentialAccept = {
      TransactionType: 'CredentialAccept',
      Account: wallets.agent.address,
      Issuer: wallets.issuer.address,
      CredentialType: CREDENTIAL_TYPE_HEX,
    };
    await confirm(client, await signAsAgent(client, wallets, accept, env.sourceTag));
  }

  printStep('Read the credential from the ledger and check it');
  const credential = await requireValidCredential(client, wallets);
  printLine('valid: right issuer, holder and type; accepted; not expired; fingerprint matches');
  printLine(`credential ID ${credential.id}`);
});
