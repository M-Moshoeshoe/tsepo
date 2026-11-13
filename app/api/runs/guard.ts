import 'server-only';
import { decideAccess, minutesText } from '../../../src/access/access-code.ts';
import { createRateLimiter, type RateLimiter } from '../../../src/access/rate-limit.ts';
import { ACCESS_CODE_HEADER } from '../../../src/demo/events.ts';

const HOUR_MS = 60 * 60 * 1000;
/** About 20 demo runs an hour, for the whole server. */
const RUNS_PER_HOUR = 20;
/** Wrong codes are limited separately, so the code cannot be guessed by trying many. */
const WRONG_CODES_PER_15_MINUTES = 10;

const limits = globalThis as typeof globalThis & { tsepoRunLimiter?: RateLimiter; tsepoWrongCodeLimiter?: RateLimiter };
limits.tsepoRunLimiter ??= createRateLimiter(RUNS_PER_HOUR, HOUR_MS);
limits.tsepoWrongCodeLimiter ??= createRateLimiter(WRONG_CODES_PER_15_MINUTES, HOUR_MS / 4);
const runLimiter = limits.tsepoRunLimiter;
const wrongCodeLimiter = limits.tsepoWrongCodeLimiter;

/** Checks the demo access code. Returns a response to send when it is not accepted. The code is never logged. */
export function refuseWrongCode(request: Request): Response | undefined {
  const decision = decideAccess(process.env.DEMO_ACCESS_CODE, request.headers.get(ACCESS_CODE_HEADER), wrongCodeLimiter, Date.now());
  return decision.allowed ? undefined : Response.json({ error: decision.error }, { status: decision.status });
}

/**
 * Counts one run against the hourly limit. Called only for a valid request that
 * got the run lock, so a malformed or conflicting request never uses up the
 * allowance. Returns a response to send when the limit is reached.
 */
export function takeRunSlot(): Response | undefined {
  const run = runLimiter.take(Date.now());
  if (!run.allowed) {
    return Response.json(
      {
        error: `Live steps are limited to about ${String(RUNS_PER_HOUR)} an hour for all visitors. Try again in ${minutesText(run.retryAfterMs)}.`,
      },
      { status: 429 },
    );
  }
  return undefined;
}
