import { isValidSecret } from 'xrpl';
import { z } from 'zod';
import { PolicyTokenSchema } from '../config/app-env.ts';
import { ClassicAddressSchema } from '../ledger/address.ts';

/**
 * The policy service's own settings when it runs on its own. It holds only
 * the policy key: it knows the issuer by address, so it can check credentials
 * on the ledger, and it never sees any other seed.
 */
export interface PolicyServerEnv {
  seed: string;
  issuerAddress: string;
  token: string;
  dataDir: string;
  port: number;
}

const PolicyServerSchema = z.object({
  POLICY_SEED: z.string().refine(isValidSecret, { message: 'Not a valid seed' }),
  ISSUER_ADDRESS: ClassicAddressSchema,
  POLICY_SERVICE_TOKEN: PolicyTokenSchema,
  TSEPO_DATA_DIR: z.preprocess((value) => (value === '' ? undefined : value), z.string().trim().min(1).default('.data')),
  PORT: z.coerce.number().int().min(1).max(65535).default(8080),
});

/** Errors name the variables that are wrong and never include their values. */
export function loadPolicyServerEnv(source: Record<string, string | undefined> = process.env): PolicyServerEnv {
  const parsed = PolicyServerSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(`The policy service is missing or has invalid settings: ${[...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))].join(', ')}.`);
  }
  const { POLICY_SEED, ISSUER_ADDRESS, POLICY_SERVICE_TOKEN, TSEPO_DATA_DIR, PORT } = parsed.data;
  return { seed: POLICY_SEED, issuerAddress: ISSUER_ADDRESS, token: POLICY_SERVICE_TOKEN, dataDir: TSEPO_DATA_DIR, port: PORT };
}
