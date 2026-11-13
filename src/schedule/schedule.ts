import { z } from 'zod';

/** How often the agent processes its instruction inbox by itself, unless the business sets another interval. */
export const DEFAULT_EVERY_MINUTES = 10;
export const MIN_EVERY_MINUTES = 1;
export const MAX_EVERY_MINUTES = 1440;

/** The business's setting: whether the agent processes its inbox by itself, and how often. */
export const ScheduleSettingsSchema = z.strictObject({
  enabled: z.boolean(),
  everyMinutes: z
    .number()
    .int('Enter a whole number of minutes.')
    .min(MIN_EVERY_MINUTES, `Choose between ${String(MIN_EVERY_MINUTES)} and ${String(MAX_EVERY_MINUTES)} minutes.`)
    .max(MAX_EVERY_MINUTES, `Choose between ${String(MIN_EVERY_MINUTES)} and ${String(MAX_EVERY_MINUTES)} minutes.`),
});

export type ScheduleSettings = z.infer<typeof ScheduleSettingsSchema>;

export const DEFAULT_SCHEDULE: ScheduleSettings = { enabled: true, everyMinutes: DEFAULT_EVERY_MINUTES };

/** One instruction waiting in the inbox. It is untrusted text, exactly like an instruction sent now. */
export const InboxItemSchema = z.strictObject({
  id: z.uuid(),
  text: z.string().min(3).max(400),
  addedAt: z.iso.datetime(),
});

export type InboxItem = z.infer<typeof InboxItemSchema>;

/** When the next scheduled check falls due, or undefined while the schedule is off. */
export function nextRunAt(settings: ScheduleSettings, lastCheckAt: string | undefined, now: Date): Date | undefined {
  if (!settings.enabled) return undefined;
  if (lastCheckAt === undefined) return now;
  return new Date(Date.parse(lastCheckAt) + settings.everyMinutes * 60_000);
}

/** Why a scheduled run did not start this time. */
export type ScheduleHold = 'off' | 'not-due' | 'empty' | 'busy' | 'paused';

export interface ScheduleCheck {
  settings: ScheduleSettings;
  lastCheckAt: string | undefined;
  inboxSize: number;
  /** Another run, by a person or the schedule, holds the ledger. */
  runActive: boolean;
  now: Date;
}

/**
 * The checks that need no ledger read, cheapest first. A scheduled run starts
 * only when the schedule is on, due, the inbox holds an instruction and no
 * other run holds the ledger. Whether the agent is still active is checked
 * after this, on the ledger, by `pausedHold`.
 */
export function scheduleHold(check: ScheduleCheck): ScheduleHold | undefined {
  const next = nextRunAt(check.settings, check.lastCheckAt, check.now);
  if (next === undefined) return 'off';
  if (next.getTime() > check.now.getTime()) return 'not-due';
  if (check.inboxSize === 0) return 'empty';
  if (check.runActive) return 'busy';
  return undefined;
}

/** A revoked agent, or one without valid spending rules, never runs by itself. */
export function pausedHold(agentActive: boolean): ScheduleHold | undefined {
  return agentActive ? undefined : 'paused';
}

/**
 * Whether a hold uses up this turn of the schedule. A busy ledger does not:
 * the run starts at the next check, as soon as the ledger is free.
 */
export function holdEndsTurn(hold: ScheduleHold): boolean {
  return hold !== 'busy' && hold !== 'not-due' && hold !== 'off';
}

/** What the business sees about the schedule, in one plain sentence. */
export function scheduleLine(input: { settings: ScheduleSettings; lastCheckAt: string | undefined; agentActive: boolean; inboxSize: number; now: Date }): string {
  const { settings, lastCheckAt, agentActive, inboxSize, now } = input;
  if (!settings.enabled) return 'Automatic runs are off. Instructions in the inbox wait until a person sends them or turns the schedule on.';
  if (!agentActive) return 'Automatic runs are paused: the agent is not active, so it cannot pay.';
  const next = nextRunAt(settings, lastCheckAt, now) ?? now;
  const minutes = Math.ceil((next.getTime() - now.getTime()) / 60_000);
  const when = minutes <= 0 ? 'Next automatic run within a minute' : `Next automatic run in ${String(minutes)} ${minutes === 1 ? 'minute' : 'minutes'}`;
  const waiting = inboxSize === 0 ? 'The inbox is empty, so it will have nothing to do.' : `${String(inboxSize)} ${inboxSize === 1 ? 'instruction is' : 'instructions are'} waiting.`;
  return `${when}. ${waiting}`;
}
