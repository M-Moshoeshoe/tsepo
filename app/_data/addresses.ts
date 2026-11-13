import 'server-only';
import { loadAppEnv } from '../../src/config/app-env.ts';
import { loadAppWallets } from '../../src/config/wallets.ts';

/** Public ledger addresses for pages that explain the setup. Addresses only: a seed never leaves the server. */
export function publicAddresses(): { issuer: string; depositAddress: string } {
  const wallets = loadAppWallets(loadAppEnv());
  return { issuer: wallets.issuer.address, depositAddress: wallets.exchange.address };
}
