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
 * Checks the demo access code and the run rate limit. Returns a response to
 * send when the run must not start, or undefined when it may.
 */
export function guardRun(request: Request): Response | undefined {
  const refused = refuseWrongCode(request);
  if (refused !== undefined) return refused;
  const run = runLimiter.take(Date.now());
  if (!run.allowed) {
    return Response.json(
      { error: `The demo allows about ${String(RUNS_PER_HOUR)} runs an hour. Try again in ${minutesText(run.retryAfterMs)}.` },
      { status: 429 },
    );
  }
  return undefined;
}
