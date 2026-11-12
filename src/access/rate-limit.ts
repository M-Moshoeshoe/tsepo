export type RateDecision = { allowed: true } | { allowed: false; retryAfterMs: number };

export interface RateLimiter {
  /** Counts one event at `now` if the window has room. */
  take(now: number): RateDecision;
}

/** Allows at most `limit` events in any sliding window of `windowMs`. Kept in memory, per server process. */
export function createRateLimiter(limit: number, windowMs: number): RateLimiter {
  let events: number[] = [];
  return {
    take(now) {
      events = events.filter((time) => now - time < windowMs);
      const oldest = events[0];
      if (events.length >= limit && oldest !== undefined) return { allowed: false, retryAfterMs: windowMs - (now - oldest) };
      events.push(now);
      return { allowed: true };
    },
  };
}
