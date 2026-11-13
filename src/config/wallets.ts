import { Wallet } from 'xrpl';
import { APP_ROLES, type AppEnv, type AppRole } from './app-env.ts';
import type { Env } from './env.ts';
import { ROLE_NAMES, type Role } from './roles.ts';

export type Wallets = Record<Role, Wallet>;

/** Builds a wallet for every role. Never log a Wallet: it holds the seed. */
export function loadWallets(env: Env): Wallets {
  return Object.fromEntries(ROLE_NAMES.map((role) => [role, Wallet.fromSeed(env.seeds[role])])) as Wallets;
}

/** The wallets the running app holds: every role but the policy key. Never log a Wallet. */
export type AppWallets = Record<AppRole, Wallet>;

export function loadAppWallets(env: AppEnv): AppWallets {
  return Object.fromEntries(APP_ROLES.map((role) => [role, Wallet.fromSeed(env.seeds[role])])) as AppWallets;
}

/** The policy service's address, from its key when it runs in-process, or as configured when it runs on its own. */
export function policyAddressOf(env: AppEnv): string {
  return env.policy.mode === 'service' ? env.policy.address : Wallet.fromSeed(env.policy.seed).address;
}
