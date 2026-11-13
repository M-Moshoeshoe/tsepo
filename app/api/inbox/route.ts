import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { dataDir } from '../../../src/config/env.ts';
import { RunRequestSchema } from '../../../src/demo/events.ts';
import { RESERVED_REFERENCE_PREFIX, usesReservedReference } from '../../../src/demo/payout-lists.ts';
import { InboxFullError, scheduleStore } from '../../../src/schedule/store.ts';
import { createFileStore } from '../../../src/storage/file-store.ts';
import { refuseWrongCode } from '../runs/guard.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Adds an instruction to the agent's inbox. The agent pays it by itself at the
 * next scheduled run, within the rules, exactly as if it were sent now. It
 * will move test funds, so it needs the access code. The text is untrusted.
 */
export async function POST(request: Request): Promise<Response> {
  const refused = refuseWrongCode(request);
  if (refused !== undefined) return refused;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'The request was not valid JSON.' }, { status: 400 });
  }
  const parsed = RunRequestSchema.safeParse(body);
  if (!parsed.success || parsed.data.kind !== 'instruction') {
    return Response.json({ error: parsed.success ? 'Only an instruction can go in the inbox.' : (parsed.error.issues[0]?.message ?? 'The instruction was not valid.') }, { status: 400 });
  }
  if (usesReservedReference(parsed.data.text)) {
    return Response.json({ error: `References that start with ${RESERVED_REFERENCE_PREFIX} are kept for the guided tour. Use another reference, or none.` }, { status: 400 });
  }
  try {
    await scheduleStore(createFileStore(join(dataDir(), 'schedule'))).add({ id: randomUUID(), text: parsed.data.text, addedAt: new Date().toISOString() });
  } catch (error: unknown) {
    if (error instanceof InboxFullError) return Response.json({ error: error.message }, { status: 409 });
    throw error;
  }
  return new Response(null, { status: 201 });
}
