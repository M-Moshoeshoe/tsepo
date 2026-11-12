import { dropsToXrp, Wallet } from 'xrpl';
import { requiredBalanceDrops } from '../src/ledger/reserve.ts';
import { ENV_FILE, hasValidSeed, loadEnv } from '../src/config/env.ts';
import { upsertEnvFile } from '../src/config/env-file.ts';
import { getAccountState, getFundingHash, getReserves } from '../src/ledger/reads.ts';
import { accountLink, printLine, printStep, txLink } from '../src/cli/output.ts';
import { ROLE_NAMES, ROLES } from '../src/config/roles.ts';
import { runScript } from '../src/cli/run.ts';
import { loadWallets } from '../src/config/wallets.ts';

/** One XRP kept above the reserve to pay transaction fees. */
const FEE_BUFFER_DROPS = 1_000_000;

/** Creates any missing seed and saves it to .env.local. Seeds are never shown. */
function createMissingSeeds(): number {
  const created: Record<string, string> = {};
  for (const role of ROLE_NAMES) {
    const variable = ROLES[role].seedVar;
    if (hasValidSeed(variable)) continue;
    const { seed } = Wallet.generate();
    if (seed === undefined) throw new Error('Wallet generation returned no seed');
    created[variable] = seed;
    process.env[variable] = seed;
  }
  if (Object.keys(created).length > 0) upsertEnvFile(ENV_FILE, created);
  return Object.keys(created).length;
}

await runScript('spike:accounts', async (client) => {
  const createdCount = createMissingSeeds();
  printLine(`${createdCount} new seeds saved to ${ENV_FILE} (values not shown)`);

  const wallets = loadWallets(loadEnv());
  const reserves = await getReserves(client);
  printLine(`ledger reserves: base ${dropsToXrp(reserves.baseDrops)} XRP, per object ${dropsToXrp(reserves.ownerDrops)} XRP`);

  for (const role of ROLE_NAMES) {
    const { funded, ownedObjects } = ROLES[role];
    if (!funded) continue;
    const { address } = wallets[role];
    printStep(`Account: ${role}`);

    if ((await getAccountState(client, address)) === undefined) {
      await client.fundWallet(wallets[role]);
    }

    const state = await getAccountState(client, address);
    const required = requiredBalanceDrops(reserves, ownedObjects, FEE_BUFFER_DROPS);
    if (state === undefined || state.balanceDrops < required) {
      throw new Error(`Account ${address} holds less than the ${dropsToXrp(required)} XRP it needs`);
    }

    printLine(accountLink(address));
    const fundingHash = await getFundingHash(client, address);
    if (fundingHash !== undefined) printLine(`funded by ${txLink(fundingHash)}`);
  }
});
