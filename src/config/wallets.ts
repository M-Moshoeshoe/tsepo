import { Wallet } from 'xrpl';
import type { Env } from './env.ts';
import { ROLE_NAMES, type Role } from './roles.ts';

export type Wallets = Record<Role, Wallet>;

/** Builds a wallet for every role. Never log a Wallet: it holds the seed. */
export function loadWallets(env: Env): Wallets {
  return Object.fromEntries(ROLE_NAMES.map((role) => [role, Wallet.fromSeed(env.seeds[role])])) as Wallets;
}
