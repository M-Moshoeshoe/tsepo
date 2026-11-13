import 'server-only';
import { loadEnv } from '../../src/config/env.ts';
import { loadWallets } from '../../src/config/wallets.ts';

/** Public ledger addresses for pages that explain the setup. Addresses only: a seed never leaves the server. */
export function publicAddresses(): { issuer: string; depositAddress: string } {
  const wallets = loadWallets(loadEnv());
  return { issuer: wallets.issuer.address, depositAddress: wallets.exchange.address };
}
