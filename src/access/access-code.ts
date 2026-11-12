import { createHash, timingSafeEqual } from 'node:crypto';

/** Codes shorter than this are treated as not configured. */
export const MIN_ACCESS_CODE_LENGTH = 6;

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

/** True when a code is configured and the provided code equals it. Compares in constant time. Never logs either value. */
export function accessCodeMatches(expected: string | undefined, provided: string | null | undefined): boolean {
  if (expected === undefined || expected.length < MIN_ACCESS_CODE_LENGTH) return false;
  if (provided === null || provided === undefined || provided === '') return false;
  return timingSafeEqual(digest(expected), digest(provided));
}

export function accessCodeConfigured(expected: string | undefined): boolean {
  return expected !== undefined && expected.length >= MIN_ACCESS_CODE_LENGTH;
}
