import { describe, expect, it } from 'vitest';
import { createMemoryStore } from '../storage/memory-store.ts';
import { contactInbox, ContactMessageSchema } from './contact.ts';

const valid = { name: 'Lerato Dlamini', email: 'lerato@example.com', message: 'I would like to know more about the pilot.' };

describe('contact messages', () => {
  it('accepts a complete message and trims it', () => {
    expect(ContactMessageSchema.parse({ ...valid, name: '  Lerato Dlamini ' }).name).toBe('Lerato Dlamini');
  });

  it('refuses a short message, a bad email and extra fields with plain words', () => {
    expect(ContactMessageSchema.safeParse({ ...valid, message: 'Hi' }).error?.issues[0]?.message).toBe('Write a message of at least 10 characters.');
    expect(ContactMessageSchema.safeParse({ ...valid, email: 'nope' }).error?.issues[0]?.message).toBe('Enter a valid email address.');
    expect(ContactMessageSchema.safeParse({ ...valid, admin: true }).success).toBe(false);
  });

  it('stores each message with an id and the time', async () => {
    const inbox = contactInbox(createMemoryStore());
    await inbox.add(ContactMessageSchema.parse(valid), '7c9e6679-7425-40de-944b-e07fc1f90ae7', new Date('2026-11-13T09:00:00.000Z'));
    expect(await inbox.list()).toHaveLength(1);
  });
});
