import { z } from 'zod';
import { collection, type DocumentStore } from '../storage/store.ts';
import { DEFAULT_SCHEDULE, InboxItemSchema, ScheduleSettingsSchema, type InboxItem, type ScheduleSettings } from './schedule.ts';

/** The most instructions that may wait in the inbox. A full inbox refuses more, so it never grows without bound. */
export const INBOX_LIMIT = 10;

const InboxSchema = z.strictObject({ items: z.array(InboxItemSchema).max(INBOX_LIMIT) });
const CheckSchema = z.strictObject({ lastCheckAt: z.iso.datetime() });

/** Thrown when an instruction would not fit in the inbox. */
export class InboxFullError extends Error {
  constructor() {
    super(`The inbox already holds ${String(INBOX_LIMIT)} instructions. Wait for the next automatic run, or send one now.`);
    this.name = 'InboxFullError';
  }
}

export interface ScheduleStore {
  settings(): Promise<ScheduleSettings>;
  /** Saves the setting. The interval counts from now, so a change never triggers a run at once. */
  saveSettings(settings: ScheduleSettings, now: Date): Promise<void>;
  lastCheckAt(): Promise<string | undefined>;
  markChecked(at: Date): Promise<void>;
  inbox(): Promise<InboxItem[]>;
  /** Adds an instruction at the back of the inbox, or throws InboxFullError. */
  add(item: InboxItem): Promise<void>;
  /** Removes and returns the oldest instruction, so it is never processed twice. */
  takeOldest(): Promise<InboxItem | undefined>;
  /** Puts an instruction back at the front, when a run could not start for a reason outside it. */
  putBack(item: InboxItem): Promise<void>;
}

/** One queue per process, so a visitor adding an instruction and the schedule taking one never overwrite each other. */
const queues = globalThis as typeof globalThis & { tsepoScheduleQueue?: Promise<unknown> };

function serially<T>(work: () => Promise<T>): Promise<T> {
  const previous = queues.tsepoScheduleQueue ?? Promise.resolve();
  const next = previous.then(work, work);
  queues.tsepoScheduleQueue = next.catch(() => undefined);
  return next;
}

export function scheduleStore(store: DocumentStore): ScheduleStore {
  const settings = collection(store, 'settings', ScheduleSettingsSchema);
  const checks = collection(store, 'checks', CheckSchema);
  const inbox = collection(store, 'inbox', InboxSchema);
  const items = async (): Promise<InboxItem[]> => (await inbox.get('inbox'))?.items ?? [];

  return {
    async settings() {
      return (await settings.get('schedule')) ?? DEFAULT_SCHEDULE;
    },
    saveSettings: (value, now) =>
      serially(async () => {
        await settings.put('schedule', value);
        await checks.put('schedule', { lastCheckAt: now.toISOString() });
      }),
    async lastCheckAt() {
      return (await checks.get('schedule'))?.lastCheckAt;
    },
    markChecked: (at) => serially(() => checks.put('schedule', { lastCheckAt: at.toISOString() })),
    inbox: items,
    add: (item) =>
      serially(async () => {
        const current = await items();
        if (current.length >= INBOX_LIMIT) throw new InboxFullError();
        await inbox.put('inbox', { items: [...current, item] });
      }),
    takeOldest: () =>
      serially(async () => {
        const [first, ...rest] = await items();
        if (first !== undefined) await inbox.put('inbox', { items: rest });
        return first;
      }),
    putBack: (item) =>
      serially(async () => {
        const current = await items();
        await inbox.put('inbox', { items: [item, ...current].slice(0, INBOX_LIMIT) });
      }),
  };
}
