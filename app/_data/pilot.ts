import 'server-only';
import { join } from 'node:path';
import { dataDir } from '../../src/config/env.ts';
import { pilotList, realPilotRequestCount } from '../../src/pilot/pilot.ts';
import { createFileStore } from '../../src/storage/file-store.ts';

/** How many real people asked to join the pilot. Only the number leaves the records, never a name or an email. */
export async function pilotRequestCount(): Promise<number> {
  return realPilotRequestCount(await pilotList(createFileStore(join(dataDir(), 'pilot'))).list());
}
