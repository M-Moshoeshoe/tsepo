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

export type AccessDecision = { allowed: true } | { allowed: false; status: 401 | 429 | 503; error: string };

/** "1 minute" or "12 minutes", rounded up, never less than one. */
export function minutesText(ms: number): string {
  const count = Math.max(1, Math.ceil(ms / 60_000));
  return count === 1 ? '1 minute' : `${String(count)} minutes`;
}

/**
 * Decides whether a provided code opens the demo. Wrong codes count against
 * their own limit, so the code cannot be found by trying many. Never logs
 * either code.
 */
export function decideAccess(
  expected: string | undefined,
  provided: string | null | undefined,
  wrongCodes: { take(now: number): { allowed: true } | { allowed: false; retryAfterMs: number } },
  now: number,
): AccessDecision {
  if (!accessCodeConfigured(expected)) {
    return { allowed: false, status: 503, error: 'Demo runs are switched off: no access code is configured on the server.' };
  }
  if (accessCodeMatches(expected, provided)) return { allowed: true };
  const wrong = wrongCodes.take(now);
  if (!wrong.allowed) {
    return { allowed: false, status: 429, error: `Too many wrong access codes. Try again in ${minutesText(wrong.retryAfterMs)}.` };
  }
  return { allowed: false, status: 401, error: 'That access code was not accepted. Check it and try again.' };
}
