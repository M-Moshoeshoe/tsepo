import { isValidSecret } from 'xrpl';
import { z } from 'zod';
import { ClassicAddressSchema } from '../ledger/address.ts';
import { DEFAULT_SOURCE_TAG } from '../ledger/testnet.ts';
import { ENV_FILE } from './env.ts';
import { ROLE_NAMES, ROLES, type Role } from './roles.ts';

/** The keys the running app holds. The policy key is not one of them when the policy service runs on its own. */
export type AppRole = Exclude<Role, 'policy'>;

export const APP_ROLES = ROLE_NAMES.filter((role): role is AppRole => role !== 'policy');

/** How the app reaches the approval (policy) service. */
export type PolicyAccess =
  /** On one machine, for local development and the CLI: the app runs the service itself, with its key. */
  | { mode: 'in-process'; seed: string }
  /** Deployed: the service runs on its own with the key; the app knows only where it is and its address. */
  | { mode: 'service'; url: string; token: string; address: string };

export interface AppEnv {
  sourceTag: number;
  dataDir: string;
  seeds: Record<AppRole, string>;
  policy: PolicyAccess;
}

/** The shared token between the app and the policy service: long and random, never logged. */
export const PolicyTokenSchema = z.string().min(32, { message: 'Use at least 32 characters' });

const SettingsSchema = z.object({
  AGENT_SOURCE_TAG: z.coerce.number().int().min(0).max(0xffffffff).default(DEFAULT_SOURCE_TAG),
  TSEPO_DATA_DIR: z.preprocess((value) => (value === '' ? undefined : value), z.string().trim().min(1).default('.data')),
});

const SeedSchema = z.string().refine(isValidSecret, { message: 'Not a valid seed' });

const ServiceSchema = z.object({
  POLICY_SERVICE_URL: z.url({ protocol: /^https?$/ }),
  POLICY_SERVICE_TOKEN: PolicyTokenSchema,
  POLICY_ADDRESS: ClassicAddressSchema,
});

function present(name: string): boolean {
  const value = process.env[name];
  return value !== undefined && value !== '';
}

/**
 * Reads the running app's settings. With POLICY_SERVICE_URL set, the app
 * reaches the policy service over the network and must not hold POLICY_SEED,
 * so a compromised app can never co-sign. Without it, the app runs the
 * service in-process with POLICY_SEED, as on a developer's machine. Errors
 * name the variables that are wrong and never include their values.
 */
export function loadAppEnv(): AppEnv {
  const invalid: string[] = APP_ROLES.map((role) => ROLES[role].seedVar).filter((name) => !SeedSchema.safeParse(process.env[name]).success);
  const settings = SettingsSchema.safeParse(process.env);
  if (!settings.success) invalid.push(...settings.error.issues.map((issue) => String(issue.path[0])));

  let policy: PolicyAccess | undefined;
  if (present('POLICY_SERVICE_URL')) {
    if (present(ROLES.policy.seedVar)) {
      throw new Error(`${ROLES.policy.seedVar} must not be set when the policy service runs on its own (POLICY_SERVICE_URL is set).`);
    }
    const service = ServiceSchema.safeParse(process.env);
    if (service.success) {
      policy = { mode: 'service', url: service.data.POLICY_SERVICE_URL, token: service.data.POLICY_SERVICE_TOKEN, address: service.data.POLICY_ADDRESS };
    } else {
      invalid.push(...service.error.issues.map((issue) => String(issue.path[0])));
    }
  } else {
    const seed = SeedSchema.safeParse(process.env[ROLES.policy.seedVar]);
    if (seed.success) policy = { mode: 'in-process', seed: seed.data };
    else invalid.push(ROLES.policy.seedVar);
  }

  if (invalid.length > 0 || !settings.success || policy === undefined) {
    throw new Error(`Missing or invalid in ${ENV_FILE} or the environment: ${[...new Set(invalid)].join(', ')}.`);
  }
  const seeds = Object.fromEntries(APP_ROLES.map((role) => [role, SeedSchema.parse(process.env[ROLES[role].seedVar])])) as Record<AppRole, string>;
  return { sourceTag: settings.data.AGENT_SOURCE_TAG, dataDir: settings.data.TSEPO_DATA_DIR, seeds, policy };
}
