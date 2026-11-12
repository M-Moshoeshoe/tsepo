import { createHash } from 'node:crypto';
import { z } from 'zod';
import type { Mandate } from './mandate.ts';

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Validates that a value is plain JSON, so it can be fingerprinted. */
export const JsonSchema: z.ZodType<Json> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(JsonSchema), z.record(z.string(), JsonSchema)]),
);

/** Compares by UTF-16 code units, so the order never depends on locale. */
export function byCodeUnit(a: string, b: string): number {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

/** JSON with object keys sorted at every level, so equal values give equal text. */
export function canonicalJson(value: Json): string {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    const members = Object.entries(value)
      .sort(([a], [b]) => byCodeUnit(a, b))
      .map(([key, member]) => `${JSON.stringify(key)}:${canonicalJson(member)}`);
    return `{${members.join(',')}}`;
  }
  return JSON.stringify(value);
}

const FINGERPRINT_PATTERN = /^sha256:([0-9a-f]{64})$/;

/** "sha256:" followed by 64 lowercase hex characters of the canonical JSON digest. */
export function fingerprintOf(value: Json): string {
  return `sha256:${createHash('sha256').update(canonicalJson(value)).digest('hex')}`;
}

/**
 * A stable fingerprint of a mandate. The order of approved recipients
 * carries no meaning, so they are sorted by their canonical form first.
 */
export function mandateFingerprint(mandate: Mandate): string {
  const recipients = mandate.approvedRecipients
    .map((recipient) => JsonSchema.parse(recipient))
    .sort((a, b) => byCodeUnit(canonicalJson(a), canonicalJson(b)));
  return fingerprintOf({ ...mandate, approvedRecipients: recipients });
}

/** The 256-bit ledger form of a fingerprint, as used in a payment's InvoiceID. */
export function fingerprintToInvoiceId(fingerprint: string): string {
  const match = FINGERPRINT_PATTERN.exec(fingerprint);
  if (match?.[1] === undefined) throw new Error('Not a sha256 fingerprint');
  return match[1].toUpperCase();
}
