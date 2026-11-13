import 'server-only';
import { join } from 'node:path';
import { dataDir } from '../../src/config/env.ts';
import { scheduleLine, type InboxItem, type ScheduleSettings } from '../../src/schedule/schedule.ts';
import { scheduleStore } from '../../src/schedule/store.ts';
import { createFileStore } from '../../src/storage/file-store.ts';

export interface ScheduleView {
  settings: ScheduleSettings;
  /** Instructions waiting for the next automatic run, oldest first. */
  inbox: InboxItem[];
  /** "Next automatic run in 7 minutes. 2 instructions are waiting." */
  line: string;
}

/** The payout schedule and its inbox, read from the service records. No ledger read: the agent's state comes from the caller. */
export async function loadSchedule(agentActive: boolean): Promise<ScheduleView> {
  const store = scheduleStore(createFileStore(join(dataDir(), 'schedule')));
  const [settings, lastCheckAt, inbox] = await Promise.all([store.settings(), store.lastCheckAt(), store.inbox()]);
  return { settings, inbox, line: scheduleLine({ settings, lastCheckAt, agentActive, inboxSize: inbox.length, now: new Date() }) };
}
