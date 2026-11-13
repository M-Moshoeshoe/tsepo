import { describe, expect, it } from 'vitest';
import { createMemoryStore } from '../storage/memory-store.ts';
import { pilotList, PilotRequestSchema, realPilotRequestCount, type StoredPilotRequest } from './pilot.ts';

const valid = { name: 'Lerato Dlamini', organisation: 'Example Payroll', kind: 'business', email: 'lerato@example.com' };

describe('pilot requests', () => {
  it('accepts a complete request and trims it', () => {
    expect(PilotRequestSchema.parse({ ...valid, name: '  Lerato Dlamini  ' }).name).toBe('Lerato Dlamini');
  });

  it.each([
    ['a missing name', { name: ' ' }, 'Enter your name.'],
    ['a bad email', { email: 'not-an-email' }, 'Enter a valid email address.'],
    ['an unknown kind', { kind: 'bank' }, 'Choose business or exchange.'],
  ])('refuses %s with a plain message', (_name, change, message) => {
    const result = PilotRequestSchema.safeParse({ ...valid, ...change });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe(message);
  });

  it('refuses extra fields', () => {
    expect(PilotRequestSchema.safeParse({ ...valid, admin: true }).success).toBe(false);
  });

  it('stores each request once, with an id and the time', async () => {
    const list = pilotList(createMemoryStore());
    const request = PilotRequestSchema.parse(valid);
    await list.add(request, '7c9e6679-7425-40de-944b-e07fc1f90ae7', new Date('2026-11-13T09:00:00.000Z'));
    expect(await list.list()).toEqual([{ ...request, id: '7c9e6679-7425-40de-944b-e07fc1f90ae7', receivedAt: '2026-11-13T09:00:00.000Z' }]);
  });
});

describe('pilot traction', () => {
  const stored = (email: string): StoredPilotRequest => ({
    id: '6f1c7f8e-4c1b-4a43-9a43-0d7c1c2a9b10',
    receivedAt: '2026-11-13T10:00:00.000Z',
    name: 'Someone',
    organisation: 'Somewhere',
    kind: 'exchange',
    email,
  });

  it('counts real requests only, never the test entries an automated run leaves', () => {
    const requests = [stored('cfo@lesedi.co.za'), stored('test@example.com'), stored('a@sub.example.org'), stored('ops@exchange.africa'), stored('x@demo.test')];
    expect(realPilotRequestCount(requests)).toBe(2);
    expect(realPilotRequestCount([])).toBe(0);
  });
});
