import { LedgerEntry, type Client, type SubmittableTransaction } from 'xrpl';
import { requireAccountState } from './ledger.ts';
import { signMulti, signSingle, type Signed } from './submit.ts';
import type { Wallets } from './wallets.ts';

/**
 * Signs a transaction from the agent account. Once the master key is
 * disabled (spike:multisig), the agent key and the policy key must both sign.
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
