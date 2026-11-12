import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { minutesText } from '../../../src/access/access-code.ts';
import { createRateLimiter, type RateLimiter } from '../../../src/access/rate-limit.ts';
import { dataDir } from '../../../src/config/env.ts';
import { pilotList, PilotRequestSchema } from '../../../src/pilot/pilot.ts';
import { createFileStore } from '../../../src/storage/file-store.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** About 20 pilot requests an hour for the whole server, so the list cannot be flooded. */
const limits = globalThis as typeof globalThis & { tsepoPilotLimiter?: RateLimiter };
limits.tsepoPilotLimiter ??= createRateLimiter(20, 60 * 60 * 1000);
const limiter = limits.tsepoPilotLimiter;

/**
 * Stores a request to join the pilot. Nothing is signed up, sent or charged.
 * The details are validated, never logged, and stay in the local data folder.
 */
export async function POST(request: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'The request was not valid.' }, { status: 400 });
  }
  const parsed = PilotRequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? 'Check the form and try again.' }, { status: 400 });

  const room = limiter.take(Date.now());
  if (!room.allowed) {
    return Response.json({ error: `Too many requests just now. Try again in ${minutesText(room.retryAfterMs)}.` }, { status: 429 });
  }
  try {
    await pilotList(createFileStore(join(dataDir(), 'pilot'))).add(parsed.data, randomUUID(), new Date());
  } catch (error: unknown) {
    console.error('[pilot] could not store a request', error instanceof Error ? error.name : 'unknown error');
    return Response.json({ error: 'Your details could not be saved. Try again in a minute.' }, { status: 503 });
  }
  return Response.json({ ok: true });
}
