import { z } from 'zod';
import { DecimalAmountSchema, toUnits } from '../domain/amount.ts';

/** Progress from a demo run. Plain data, so it can be printed or streamed to the browser. */
export type DemoEvent =
  | { type: 'step'; text: string }
  | { type: 'line'; text: string; hash?: string | undefined }
  | { type: 'done'; text: string }
  | { type: 'failed'; text: string };

export type Report = (event: DemoEvent) => void;

const SimpleRunSchema = z.strictObject({
  kind: z.enum(['reset', 'scenario-1', 'scenario-2', 'scenario-3', 'scenario-4', 'revoke']),
});

const ChangeLimitsSchema = z.strictObject({
  kind: z.literal('change-limits'),
  perPaymentLimit: DecimalAmountSchema,
  dailyLimit: DecimalAmountSchema,
});

/** What the browser may ask the server to run. Validated at the boundary. */
export const RunRequestSchema = z
  .discriminatedUnion('kind', [SimpleRunSchema, ChangeLimitsSchema])
  .refine((request) => request.kind !== 'change-limits' || toUnits(request.perPaymentLimit) <= toUnits(request.dailyLimit), {
    message: 'The per-payment limit cannot be more than the daily limit',
  });

export type RunRequest = z.infer<typeof RunRequestSchema>;
export type RunKind = RunRequest['kind'];
