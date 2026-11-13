import { z } from 'zod';
import { appendOnlyLog, collection, type AppendOnlyLog, type Collection, type DocumentStore } from '../storage/store.ts';
import { MAX_LIST_LENGTH, PayoutIntentSchema } from './payout-parser.ts';

/** The latest state of one payout, keyed by its reference. */
export const PayoutRecordSchema = z.strictObject({
  reference: z.string(),
  status: z.enum(['package-sent', 'refused', 'signed', 'paid', 'failed']),
  invoiceId: z.string().optional(),
  hash: z.string().optional(),
  reasons: z.array(z.string()),
  updatedAt: z.iso.datetime(),
});

export type PayoutRecord = z.infer<typeof PayoutRecordSchema>;

/** Who started an agent run: a person, on Give an instruction or in the tour, or the payout schedule by itself. */
export const StartedBySchema = z.enum(['person', 'schedule']);

export type StartedBy = z.infer<typeof StartedBySchema>;

/** One agent run: the plain-language instruction, the payouts read from it, and who started it. Older records have no starter: a person started them. */
export const RunRecordSchema = z.strictObject({
  id: z.string(),
  startedAt: z.iso.datetime(),
  instruction: z.string().max(MAX_LIST_LENGTH),
  intents: z.array(PayoutIntentSchema),
  startedBy: StartedBySchema.optional(),
});

export type RunRecord = z.infer<typeof RunRecordSchema>;

export interface AgentRecords {
  payouts: Collection<PayoutRecord>;
  runs: Collection<RunRecord>;
  /** Every change to every payout, in order. Never edited. */
  events: AppendOnlyLog<PayoutRecord>;
}

export function agentRecords(store: DocumentStore): AgentRecords {
  return {
    payouts: collection(store, 'payouts', PayoutRecordSchema),
    runs: collection(store, 'runs', RunRecordSchema),
    events: appendOnlyLog(store, 'events', PayoutRecordSchema),
  };
}
