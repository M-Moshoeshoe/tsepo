import { deriveAddress, sign, verify } from 'ripple-keypairs';
import { z } from 'zod';
import { canonicalJson } from './fingerprint.ts';
import { MandateSchema } from './mandate.ts';

/** A change only the business may make: setting its agent's mandate. */
export const AdminActionSchema = z.strictObject({
  type: z.literal('set-mandate'),
  mandate: MandateSchema,
  /** Each new action must be later than the last one applied, so old actions cannot be replayed. */
  issuedAt: z.iso.datetime(),
});

export type AdminAction = z.infer<typeof AdminActionSchema>;

export const SignedAdminActionSchema = z.strictObject({
  action: AdminActionSchema,
  publicKey: z.string().regex(/^[0-9A-F]{66}$/),
  signature: z.string().regex(/^[0-9A-F]+$/),
});

export type SignedAdminAction = z.infer<typeof SignedAdminActionSchema>;

export interface SigningKeys {
  publicKey: string;
  privateKey: string;
}

function messageHex(action: AdminAction): string {
  return Buffer.from(canonicalJson(action), 'utf8').toString('hex').toUpperCase();
}

export function signAdminAction(action: AdminAction, keys: SigningKeys): SignedAdminAction {
  return {
    action,
    publicKey: keys.publicKey.toUpperCase(),
    signature: sign(messageHex(action), keys.privateKey).toUpperCase(),
  };
}

export type AdminVerification = { valid: true; signer: string } | { valid: false };

/** Checks the signature and returns the address of the key that made it. */
export function verifyAdminAction(input: unknown): AdminVerification {
  const parsed = SignedAdminActionSchema.safeParse(input);
  if (!parsed.success) return { valid: false };
  const { action, publicKey, signature } = parsed.data;
  try {
    if (!verify(messageHex(action), signature, publicKey)) return { valid: false };
    return { valid: true, signer: deriveAddress(publicKey) };
  } catch {
    return { valid: false };
  }
}
