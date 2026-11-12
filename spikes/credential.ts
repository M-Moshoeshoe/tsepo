import { convertStringToHex, isoTimeToRippleTime, type CredentialAccept, type CredentialCreate } from 'xrpl';
import { isAccepted } from '../src/credential/credential-check.ts';
import { mandateFingerprint } from '../src/mandate/fingerprint.ts';
import { signAsAgent } from './lib/agent.ts';
import { agentCredentialQuery, CREDENTIAL_TYPE_HEX, requireValidCredential } from './lib/credential.ts';
import { loadEnv } from './lib/env.ts';
import { findCredential } from './lib/ledger.ts';
import { sampleMandate } from './lib/mandate.ts';
import { printLine, printStep } from './lib/output.ts';
import { runSpike } from './lib/run.ts';
import { signSingle, submitAndConfirm } from './lib/submit.ts';
import { loadWallets } from './lib/wallets.ts';

await runSpike('credential', async (client) => {
  const env = loadEnv();
  const wallets = loadWallets(env);
  const mandate = sampleMandate(wallets);
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
    await submitAndConfirm(client, await signSingle(client, wallets.issuer, create));
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
    await submitAndConfirm(client, await signAsAgent(client, wallets, accept, env.sourceTag));
  }

  printStep('Read the credential from the ledger and check it');
  const credential = await requireValidCredential(client, wallets);
  printLine('valid: right issuer, holder and type; accepted; not expired; fingerprint matches');
  printLine(`credential ID ${credential.id}`);
});
