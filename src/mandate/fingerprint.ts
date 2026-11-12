import { createHash } from 'node:crypto';
import type { Mandate } from './mandate.ts';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** Compares by UTF-16 code units, so the order never depends on locale. */
function byCodeUnit(a: string, b: string): number {
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

/**
 * A stable fingerprint of a mandate: "sha256:" followed by 64 hex characters.
 * The order of approved recipients carries no meaning, so it is sorted first.
 */
export function mandateFingerprint(mandate: Mandate): string {
  const normalised: Mandate = {
    ...mandate,
    approvedRecipients: [...mandate.approvedRecipients].sort(byCodeUnit),
  };
  const digest = createHash('sha256').update(canonicalJson(normalised)).digest('hex');
  return `sha256:${digest}`;
}
