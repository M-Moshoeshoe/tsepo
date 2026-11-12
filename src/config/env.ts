import { isValidSecret } from 'xrpl';
import { z } from 'zod';
import { DEFAULT_SOURCE_TAG } from '../ledger/testnet.ts';
import { ROLE_NAMES, ROLES, type Role } from './roles.ts';

export const ENV_FILE = '.env.local';

const SeedSchema = z.string().refine(isValidSecret, { message: 'Not a valid seed' });

const SettingsSchema = z.object({
  AGENT_SOURCE_TAG: z.coerce.number().int().min(0).max(0xffffffff).default(DEFAULT_SOURCE_TAG),
  /** Where the services keep their records. A persistent volume when deployed. */
  TSEPO_DATA_DIR: z.preprocess((value) => (value === '' ? undefined : value), z.string().trim().min(1).default('.data')),
});

export interface Env {
  sourceTag: number;
  dataDir: string;
  seeds: Record<Role, string>;
}

/** True when the variable holds a usable seed. Never reveals the value. */
export function hasValidSeed(variable: string): boolean {
  return SeedSchema.safeParse(process.env[variable]).success;
}

/**
 * Reads and validates settings from the environment. Errors name the
 * variables that are wrong and never include their values.
 */
export function loadEnv(): Env {
  const invalid: string[] = ROLE_NAMES.map((role) => ROLES[role].seedVar).filter((name) => !hasValidSeed(name));
  const settings = SettingsSchema.safeParse(process.env);
  if (!settings.success) invalid.push(...settings.error.issues.map((issue) => String(issue.path[0])));

  if (invalid.length > 0 || !settings.success) {
    throw new Error(`Missing or invalid in ${ENV_FILE}: ${invalid.join(', ')}. Run npm run spike:accounts first.`);
  }

  const seeds = Object.fromEntries(
    ROLE_NAMES.map((role) => [role, SeedSchema.parse(process.env[ROLES[role].seedVar])]),
  ) as Record<Role, string>;

  return { sourceTag: settings.data.AGENT_SOURCE_TAG, dataDir: settings.data.TSEPO_DATA_DIR, seeds };
}

/** Only the data folder, for parts that keep records but never touch the ledger, such as the pilot list. */
export function dataDir(): string {
  const settings = SettingsSchema.safeParse(process.env);
  if (!settings.success) throw new Error('Invalid TSEPO_DATA_DIR setting');
  return settings.data.TSEPO_DATA_DIR;
}
