import { join } from 'node:path';
import { dataDir } from '../../../src/config/env.ts';
import { ScheduleSettingsSchema } from '../../../src/schedule/schedule.ts';
import { scheduleStore } from '../../../src/schedule/store.ts';
import { createFileStore } from '../../../src/storage/file-store.ts';
import { refuseWrongCode } from '../runs/guard.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The business turns the payout schedule on or off and sets its interval.
 * It changes what the agent does by itself, so it needs the access code.
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
  const parsed = ScheduleSettingsSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? 'The setting was not valid.' }, { status: 400 });
  await scheduleStore(createFileStore(join(dataDir(), 'schedule'))).saveSettings(parsed.data, new Date());
  return new Response(null, { status: 204 });
}
