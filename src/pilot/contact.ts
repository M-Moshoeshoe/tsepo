import { z } from 'zod';
import { appendOnlyLog, type DocumentStore } from '../storage/store.ts';

/**
 * A message from the Contact page. Stored in the local data folder only:
 * never logged, never on the ledger, never sent to another service.
 */
export const ContactMessageSchema = z.strictObject({
  name: z.string().trim().min(2, 'Enter your name.').max(100, 'Keep your name under 100 characters.'),
  email: z.email('Enter a valid email address.').max(200, 'Keep the email address under 200 characters.'),
  message: z.string().trim().min(10, 'Write a message of at least 10 characters.').max(1000, 'Keep the message under 1000 characters.'),
});

export type ContactMessage = z.infer<typeof ContactMessageSchema>;

const StoredMessageSchema = ContactMessageSchema.extend({ id: z.uuid(), receivedAt: z.iso.datetime() });

export type StoredContactMessage = z.infer<typeof StoredMessageSchema>;

export function contactInbox(store: DocumentStore): {
  add: (message: ContactMessage, id: string, now: Date) => Promise<StoredContactMessage>;
  list: () => Promise<StoredContactMessage[]>;
} {
  const log = appendOnlyLog(store, 'messages', StoredMessageSchema);
  return {
    async add(message, id, now) {
      const stored = StoredMessageSchema.parse({ ...message, id, receivedAt: now.toISOString() });
      await log.append(stored);
      return stored;
    },
    list: () => log.readAll(),
  };
}
