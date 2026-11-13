import { z } from 'zod';
import { MandateSchema } from '../domain/mandate.ts';
import { AdminReason, PolicyReason } from '../domain/reasons.ts';
import { ClassicAddressSchema } from '../ledger/address.ts';
import { PolicyLogEntrySchema } from './records.ts';

/**
 * What travels between the app and the policy service when the service runs
 * on its own. Both sides check every body against these schemas: the service
 * treats every request as untrusted, and the app treats every answer the same.
 */
export const POLICY_PATHS = {
  health: '/health',
  review: '/review',
  admin: '/admin',
  mandate: '/mandate',
  today: '/today',
  log: '/log',
  clearDailyTotals: '/demo/clear-daily-totals',
} as const;

/** The header that carries the shared token. */
export const POLICY_TOKEN_HEADER = 'authorization';

export const ReviewBodySchema = z.object({ payment: z.unknown(), purpose: z.unknown() });
export const AdminBodySchema = z.object({ action: z.unknown() });
export const AgentQuerySchema = z.object({ agent: ClassicAddressSchema });

const PolicyReasonSchema = z.enum(Object.values(PolicyReason) as [PolicyReason, ...PolicyReason[]]);
const AdminReasonSchema = z.enum(Object.values(AdminReason) as [AdminReason, ...AdminReason[]]);

export const ReviewResultSchema = z.discriminatedUnion('decision', [
  z.strictObject({ decision: z.literal('signed'), signature: z.string().regex(/^[0-9A-Fa-f]+$/) }),
  z.strictObject({ decision: z.literal('refused'), reasons: z.array(PolicyReasonSchema).min(1) }),
]);

export const AdminResultSchema = z.union([
  z.strictObject({ applied: z.literal(true) }),
  z.strictObject({ applied: z.literal(false), reason: AdminReasonSchema }),
]);

export const MandateAnswerSchema = z.strictObject({ mandate: MandateSchema.nullable() });
/** A day total can be 0, so it is a plain non-negative decimal, not a payment amount. */
export const TodayAnswerSchema = z.strictObject({ total: z.string().regex(/^\d{1,15}(\.\d{1,15})?$/) });
export const LogAnswerSchema = z.strictObject({ entries: z.array(PolicyLogEntrySchema) });
export const DoneAnswerSchema = z.strictObject({ done: z.literal(true) });
