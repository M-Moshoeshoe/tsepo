import { describe, expect, it } from 'vitest';
import { accessCodeConfigured, accessCodeMatches, decideAccess } from './access-code.ts';
import { createRateLimiter } from './rate-limit.ts';

describe('access decision', () => {
  const code = 'lesedi-2026';

  it('allows the right code without counting it as wrong', () => {
    const wrong = createRateLimiter(1, 60_000);
    expect(decideAccess(code, code, wrong, 0)).toEqual({ allowed: true });
    expect(decideAccess(code, code, wrong, 0)).toEqual({ allowed: true });
    expect(decideAccess(code, 'wrong-code', wrong, 0)).toMatchObject({ allowed: false, status: 401 });
  });

  it('refuses a wrong code with a clear sentence, then limits repeated wrong codes', () => {
    const wrong = createRateLimiter(2, 60_000);
    expect(decideAccess(code, 'wrong-code', wrong, 0)).toEqual({
      allowed: false,
      status: 401,
      error: 'That access code was not accepted. Check it and try again.',
    });
    expect(decideAccess(code, 'wrong-code', wrong, 1000)).toMatchObject({ allowed: false, status: 401 });
    expect(decideAccess(code, 'wrong-code', wrong, 2000)).toEqual({
      allowed: false,
      status: 429,
      error: 'Too many wrong access codes. Try again in 1 minute.',
    });
  });

  it('switches runs off when no usable code is configured', () => {
    expect(decideAccess(undefined, 'anything', createRateLimiter(10, 60_000), 0)).toMatchObject({ allowed: false, status: 503 });
  });
});

describe('access code', () => {
  it('matches only the configured code', () => {
    expect(accessCodeMatches('lesedi-2026', 'lesedi-2026')).toBe(true);
    expect(accessCodeMatches('lesedi-2026', 'lesedi-2027')).toBe(false);
    expect(accessCodeMatches('lesedi-2026', '')).toBe(false);
    expect(accessCodeMatches('lesedi-2026', null)).toBe(false);
  });

  it('fails closed when no usable code is configured', () => {
    expect(accessCodeMatches(undefined, 'anything')).toBe(false);
    expect(accessCodeMatches('short', 'short')).toBe(false);
    expect(accessCodeConfigured(undefined)).toBe(false);
    expect(accessCodeConfigured('lesedi-2026')).toBe(true);
  });
});

describe('rate limiter', () => {
  it('allows the limit within the window, then says when to retry', () => {
    const limiter = createRateLimiter(3, 60_000);
    expect([0, 1000, 2000].map((t) => limiter.take(t).allowed)).toEqual([true, true, true]);
    expect(limiter.take(3000)).toEqual({ allowed: false, retryAfterMs: 57_000 });
  });

  it('frees room as old events leave the window', () => {
    const limiter = createRateLimiter(2, 60_000);
    limiter.take(0);
    limiter.take(10_000);
    expect(limiter.take(59_999).allowed).toBe(false);
    expect(limiter.take(60_000).allowed).toBe(true);
  });
});
