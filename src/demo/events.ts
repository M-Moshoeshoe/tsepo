import { z } from 'zod';
import { DecimalAmountSchema, toUnits } from '../domain/amount.ts';

const HashSchema = z.string().regex(/^[0-9A-F]{64}$/);

/** Who cleared or stopped a payment: the ledger, the policy service or the exchange. */
export const ActorSchema = z.enum(['ledger', 'policy', 'exchange']);

export type Actor = z.infer<typeof ActorSchema>;

/** What a scenario showed, in two plain sentences, which control decided it, and where to see the evidence. */
export const ExplanationSchema = z.strictObject({
  sentences: z.tuple([z.string(), z.string()]),
  decidedBy: ActorSchema,
  evidence: z.strictObject({
    label: z.string(),
    /** A transaction on the ledger explorer. */
    hash: HashSchema.optional(),
    /** A screen in this app, such as the compliance desk filtered to refusals. */
    path: z.string().regex(/^\/[a-z0-9/?=&-]*$/).optional(),
  }),
});

export type Explanation = z.infer<typeof ExplanationSchema>;

/** Progress from a demo run. Plain data, so it can be printed or streamed and validated in the browser. */
export const DemoEventSchema = z.discriminatedUnion('type', [
  z.strictObject({ type: z.literal('step'), text: z.string() }),
  z.strictObject({ type: z.literal('line'), text: z.string(), hash: HashSchema.optional() }),
  z.strictObject({ type: z.literal('done'), text: z.string(), explanation: ExplanationSchema.optional() }),
  z.strictObject({ type: z.literal('failed'), text: z.string() }),
]);

export type DemoEvent = z.infer<typeof DemoEventSchema>;

export type Report = (event: DemoEvent) => void;

/** The request header that carries the demo access code. */
export const ACCESS_CODE_HEADER = 'x-demo-access-code';

const SimpleRunSchema = z.strictObject({
  kind: z.enum(['reset', 'scenario-1', 'scenario-2', 'scenario-3', 'scenario-4', 'revoke']),
});

/** The longest instruction a visitor may give the agent. */
export const INSTRUCTION_MAX_LENGTH = 400;

/** An instruction typed by a visitor. It is untrusted text: Claude only reads it, and the rules decide. */
const InstructionSchema = z.strictObject({
  kind: z.literal('instruction'),
  text: z
    .string()
    .trim()
    .min(3, 'Write an instruction of at least 3 characters.')
    .max(INSTRUCTION_MAX_LENGTH, `Keep the instruction under ${String(INSTRUCTION_MAX_LENGTH)} characters.`),
});

const ChangeLimitsSchema = z.strictObject({
  kind: z.literal('change-limits'),
  perPaymentLimit: DecimalAmountSchema,
  dailyLimit: DecimalAmountSchema,
});

/** What the browser may ask the server to run. Validated at the boundary. */
export const RunRequestSchema = z
  .discriminatedUnion('kind', [SimpleRunSchema, ChangeLimitsSchema, InstructionSchema])
  .refine((request) => request.kind !== 'change-limits' || toUnits(request.perPaymentLimit) <= toUnits(request.dailyLimit), {
    message: 'The per-payment limit cannot be more than the daily limit',
  });

export type RunRequest = z.infer<typeof RunRequestSchema>;
export type RunKind = RunRequest['kind'];
