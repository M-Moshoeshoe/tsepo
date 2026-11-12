import 'server-only';
import { accessCodeConfigured, accessCodeMatches } from '../../../src/access/access-code.ts';
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

function minutes(ms: number): number {
  return Math.max(1, Math.ceil(ms / 60_000));
}

/**
 * Checks the demo access code and the rate limits. Returns a response to send
 * when the run must not start, or undefined when it may. The code is never logged.
 */
export function guardRun(request: Request): Response | undefined {
  const expected = process.env.DEMO_ACCESS_CODE;
  if (!accessCodeConfigured(expected)) {
    return Response.json({ error: 'Demo runs are switched off: no access code is configured on the server.' }, { status: 503 });
  }
  if (!accessCodeMatches(expected, request.headers.get(ACCESS_CODE_HEADER))) {
    const wrong = wrongCodeLimiter.take(Date.now());
    if (!wrong.allowed) {
      return Response.json(
        { error: `Too many wrong access codes. Try again in ${minutes(wrong.retryAfterMs)} minutes.` },
        { status: 429 },
      );
    }
    return Response.json({ error: 'The demo access code was not accepted. Enter it again.' }, { status: 401 });
  }
  const run = runLimiter.take(Date.now());
  if (!run.allowed) {
    return Response.json(
      { error: `The demo allows about ${RUNS_PER_HOUR} runs an hour. Try again in ${minutes(run.retryAfterMs)} minutes.` },
      { status: 429 },
    );
  }
  return undefined;
}
