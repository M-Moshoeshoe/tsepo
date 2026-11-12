import { convertStringToHex, unixTimeToRippleTime, type Client } from 'xrpl';
import { AGENT_MANDATE_CREDENTIAL_TYPE, checkCredential } from '../../src/credential/credential-check.ts';
import { mandateFingerprint } from '../../src/mandate/fingerprint.ts';
import { findCredential, type FoundCredential } from './ledger.ts';
import { sampleMandate } from './mandate.ts';
import type { Wallets } from './wallets.ts';

export const CREDENTIAL_TYPE_HEX = convertStringToHex(AGENT_MANDATE_CREDENTIAL_TYPE);

export function agentCredentialQuery(wallets: Wallets): {
  subject: string;
  issuer: string;
  credentialTypeHex: string;
} {
  return { subject: wallets.agent.address, issuer: wallets.issuer.address, credentialTypeHex: CREDENTIAL_TYPE_HEX };
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
      fingerprint: mandateFingerprint(sampleMandate(wallets)),
    },
    unixTimeToRippleTime(Date.now()),
  );
  if (!check.valid) throw new Error(`The agent credential is not valid: it ${check.problems.join('; it ')}`);
  return found;
}
