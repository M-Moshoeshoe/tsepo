import { describe, expect, it } from 'vitest';
import { DEFAULT_SCHEDULE, nextRunAt, pausedHold, scheduleHold, scheduleLine, ScheduleSettingsSchema } from './schedule.ts';

const NOW = new Date('2026-11-13T10:00:00.000Z');
const minutesAgo = (minutes: number): string => new Date(NOW.getTime() - minutes * 60_000).toISOString();
const on = { enabled: true, everyMinutes: 10 };

describe('the payout schedule', () => {
  it('runs every 10 minutes by default', () => {
    expect(DEFAULT_SCHEDULE).toEqual({ enabled: true, everyMinutes: 10 });
  });

  it('accepts 1 to 1440 whole minutes, and nothing else', () => {
    expect(ScheduleSettingsSchema.safeParse({ enabled: true, everyMinutes: 1 }).success).toBe(true);
    expect(ScheduleSettingsSchema.safeParse({ enabled: false, everyMinutes: 1440 }).success).toBe(true);
    for (const everyMinutes of [0, 1441, 2.5, -3]) expect(ScheduleSettingsSchema.safeParse({ enabled: true, everyMinutes }).success).toBe(false);
  });

  it('falls due one interval after the last check, and at once when it never checked', () => {
    expect(nextRunAt(on, undefined, NOW)).toEqual(NOW);
    expect(nextRunAt(on, minutesAgo(3), NOW)?.toISOString()).toBe('2026-11-13T10:07:00.000Z');
    expect(nextRunAt({ enabled: false, everyMinutes: 10 }, minutesAgo(30), NOW)).toBeUndefined();
  });

  it('starts a run only when it is on, due, the inbox holds an instruction and the ledger is free', () => {
    const due = { settings: on, lastCheckAt: minutesAgo(10), inboxSize: 1, runActive: false, now: NOW };
    expect(scheduleHold(due)).toBeUndefined();
    expect(scheduleHold({ ...due, settings: { enabled: false, everyMinutes: 10 } })).toBe('off');
    expect(scheduleHold({ ...due, lastCheckAt: minutesAgo(4) })).toBe('not-due');
    expect(scheduleHold({ ...due, inboxSize: 0 })).toBe('empty');
    expect(scheduleHold({ ...due, runActive: true })).toBe('busy');
  });

  it('pauses while the agent is not active', () => {
    expect(pausedHold(false)).toBe('paused');
    expect(pausedHold(true)).toBeUndefined();
  });

  it('tells the business when the next run is, or why there is none', () => {
    const line = (overrides: Partial<Parameters<typeof scheduleLine>[0]>): string =>
      scheduleLine({ settings: on, lastCheckAt: minutesAgo(3), agentActive: true, inboxSize: 2, now: NOW, ...overrides });
    expect(line({})).toBe('Next automatic run in 7 minutes. 2 instructions are waiting.');
    expect(line({ lastCheckAt: minutesAgo(9), inboxSize: 1 })).toBe('Next automatic run in 1 minute. 1 instruction is waiting.');
    expect(line({ lastCheckAt: minutesAgo(12), inboxSize: 0 })).toBe('Next automatic run within a minute. The inbox is empty, so it will have nothing to do.');
    expect(line({ agentActive: false })).toBe('Automatic runs are paused: the agent is not active, so it cannot pay.');
    expect(line({ settings: { enabled: false, everyMinutes: 10 } })).toMatch(/^Automatic runs are off\./);
  });
});
