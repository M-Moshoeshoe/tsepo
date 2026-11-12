import { LedgerEntry, type Client, type SignerListSet, type SubmittableTransaction } from 'xrpl';
import { confirm } from '../../src/cli/report.ts';
import { printLine } from '../../src/cli/output.ts';
import type { Wallets } from '../../src/config/wallets.ts';
import { getSignerList, requireAccountState } from '../../src/ledger/reads.ts';
import { signMulti, signSingle, type Signed } from '../../src/ledger/submit.ts';
import { AGENT_SIGNER_QUORUM, agentSignerEntries, isAgentSignerList } from '../../src/registry/signer-list.ts';

/**
 * Signs a transaction from the agent account in the spikes. Once the master
 * key is disabled, the agent key and the policy key sign together.
 */
export async function signAsAgent(
  client: Client,
  wallets: Wallets,
  tx: SubmittableTransaction,
  sourceTag: number,
): Promise<Signed> {
  const { flags } = await requireAccountState(client, wallets.agent.address);
  const masterDisabled = (flags & LedgerEntry.AccountRootFlags.lsfDisableMaster) !== 0;
  return masterDisabled
    ? signMulti(client, [wallets.agentSigner, wallets.policy], tx, sourceTag)
    : signSingle(client, wallets.agent, tx, sourceTag);
}

export function signerAddresses(wallets: Wallets): { business: string; agentSigner: string; policy: string } {
  return { business: wallets.business.address, agentSigner: wallets.agentSigner.address, policy: wallets.policy.address };
}

/** Sets the agent signer list (business 2, agent 1, policy 1, quorum 2) unless it is already in place. */
export async function ensureAgentSignerList(client: Client, wallets: Wallets, sourceTag: number): Promise<void> {
  const addresses = signerAddresses(wallets);
  if (isAgentSignerList(await getSignerList(client, wallets.agent.address), addresses)) {
    printLine('signer list already in place');
    return;
  }
  const signerList: SignerListSet = {
    TransactionType: 'SignerListSet',
    Account: wallets.agent.address,
    SignerQuorum: AGENT_SIGNER_QUORUM,
    SignerEntries: agentSignerEntries(addresses),
  };
  await confirm(client, await signAsAgent(client, wallets, signerList, sourceTag));
}
