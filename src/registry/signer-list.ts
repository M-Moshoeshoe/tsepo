import type { SignerEntry } from 'xrpl';
import type { SignerList } from '../ledger/reads.ts';

/**
 * Who controls an agent account once its master key is disabled:
 * - the agent key and the policy key together (1 + 1) make every payment;
 * - the business key alone (2) is the recovery key and administers the account;
 * - no other single key reaches the quorum of 2.
 */
export const AGENT_SIGNER_QUORUM = 2;

export interface AgentSignerAddresses {
  business: string;
  agentSigner: string;
  policy: string;
}

export function agentSignerEntries(addresses: AgentSignerAddresses): SignerEntry[] {
  return [
    { SignerEntry: { Account: addresses.business, SignerWeight: 2 } },
    { SignerEntry: { Account: addresses.agentSigner, SignerWeight: 1 } },
    { SignerEntry: { Account: addresses.policy, SignerWeight: 1 } },
  ];
}

/** True when the ledger signer list is exactly the agent signer list. */
export function isAgentSignerList(list: SignerList | undefined, addresses: AgentSignerAddresses): boolean {
  if (list?.SignerQuorum !== AGENT_SIGNER_QUORUM) return false;
  const actual = list.SignerEntries.map(({ SignerEntry }) => `${SignerEntry.Account}:${SignerEntry.SignerWeight}`).sort();
  const expected = agentSignerEntries(addresses)
    .map(({ SignerEntry }) => `${SignerEntry.Account}:${SignerEntry.SignerWeight}`)
    .sort();
  return actual.join() === expected.join();
}
