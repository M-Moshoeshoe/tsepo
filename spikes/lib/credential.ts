import { unixTimeToRippleTime, type Client } from 'xrpl';
import { AGENT_MANDATE_CREDENTIAL_TYPE, checkCredential } from '../../src/domain/credential-check.ts';
import { mandateFingerprint } from '../../src/domain/fingerprint.ts';
import { findCredential, type FoundCredential } from '../../src/ledger/reads.ts';
import { demoMandate } from '../../src/config/demo.ts';
import type { Wallets } from '../../src/config/wallets.ts';
import { agentCredentialQuery as sharedQuery, type CredentialQuery } from '../../src/ledger/credential.ts';

export { CREDENTIAL_TYPE_HEX } from '../../src/ledger/credential.ts';

export function agentCredentialQuery(wallets: Wallets): CredentialQuery {
  return sharedQuery(wallets.agent.address, wallets.issuer.address);
}

/** Reads the agent credential from the ledger and fails unless it proves the current mandate. */
export async function requireValidCredential(client: Client, wallets: Wallets): Promise<FoundCredential> {
  const found = await findCredential(client, agentCredentialQuery(wallets));
  if (found === undefined) {
    throw new Error('The agent holds no AGENT_MANDATE credential. Run npm run spike:credential first.');
  }

  const check = checkCredential(
    found.entry,
    {
      issuer: wallets.issuer.address,
      subject: wallets.agent.address,
      credentialType: AGENT_MANDATE_CREDENTIAL_TYPE,
      fingerprint: mandateFingerprint(demoMandate(wallets)),
    },
    unixTimeToRippleTime(Date.now()),
  );
  if (!check.valid) throw new Error(`The agent credential is not valid: it ${check.problems.join('; it ')}`);
  return found;
}
