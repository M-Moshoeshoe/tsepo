import { z } from 'zod';
import { appendOnlyLog, type DocumentStore } from '../storage/store.ts';

/**
 * A request to join the pilot, from the landing page. It is not a sign-up:
 * nothing is created, signed or charged. The details stay in the local data
 * folder and never go on the ledger, in a log, or to another service.
 */
export const PilotRequestSchema = z.strictObject({
  name: z.string().trim().min(2, 'Enter your name.').max(100, 'Keep your name under 100 characters.'),
  organisation: z.string().trim().min(2, 'Enter your organisation.').max(120, 'Keep the organisation under 120 characters.'),
  kind: z.enum(['business', 'exchange'], { error: 'Choose business or exchange.' }),
  email: z.email('Enter a valid email address.').max(200, 'Keep the email address under 200 characters.'),
});

export type PilotRequest = z.infer<typeof PilotRequestSchema>;

const StoredRequestSchema = PilotRequestSchema.extend({ id: z.uuid(), receivedAt: z.iso.datetime() });

export type StoredPilotRequest = z.infer<typeof StoredRequestSchema>;

export interface PilotList {
  add(request: PilotRequest, id: string, now: Date): Promise<StoredPilotRequest>;
  list(): Promise<StoredPilotRequest[]>;
}

export function pilotList(store: DocumentStore): PilotList {
  const log = appendOnlyLog(store, 'requests', StoredRequestSchema);
  return {
    async add(request, id, now) {
      const stored = StoredRequestSchema.parse({ ...request, id, receivedAt: now.toISOString() });
      await log.append(stored);
      return stored;
    },
    list: () => log.readAll(),
  };
}

/** Domains kept for examples and tests (RFC 2606 and RFC 6761). A request from one is never counted as real interest. */
const TEST_EMAIL = /@(?:[a-z0-9-]+.)*(?:example.(?:com|net|org)|example|test|invalid|localhost)$/i;

/** How many real people asked to join the pilot: test entries are left out, and no name or email leaves this function. */
export function realPilotRequestCount(requests: readonly StoredPilotRequest[]): number {
  return requests.filter((request) => !TEST_EMAIL.test(request.email)).length;
}
