import { convertStringToHex } from 'xrpl';
import { AGENT_MANDATE_CREDENTIAL_TYPE } from '../domain/credential-check.ts';

/** AGENT_MANDATE as the hex credential type stored on the ledger. */
export const CREDENTIAL_TYPE_HEX = convertStringToHex(AGENT_MANDATE_CREDENTIAL_TYPE);

export interface CredentialQuery {
  subject: string;
  issuer: string;
  credentialTypeHex: string;
}

export function agentCredentialQuery(agent: string, issuer: string): CredentialQuery {
  return { subject: agent, issuer, credentialTypeHex: CREDENTIAL_TYPE_HEX };
}
