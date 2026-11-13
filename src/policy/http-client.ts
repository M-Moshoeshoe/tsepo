import type { z } from 'zod';
import type { PolicyService } from './policy-service.ts';
import {
  AdminResultSchema,
  DoneAnswerSchema,
  LogAnswerSchema,
  MandateAnswerSchema,
  POLICY_PATHS,
  ReviewResultSchema,
  TodayAnswerSchema,
} from './wire.ts';

/** A review reads the credential from the ledger, so it gets more time than the other calls. */
const TIMEOUT_MS = 30_000;

export type FetchLike = (input: string, init: { method: string; headers: Record<string, string>; body?: string; signal?: AbortSignal }) => Promise<{
  ok: boolean;
  status: number;
  json(): Promise<unknown>;
}>;

/**
 * The policy service as the app sees it when the service runs on its own.
 * Same interface as the in-process service, so nothing else changes. Every
 * answer is checked with Zod, and any failure throws, so the payment stops:
 * the app fails closed and never signs on the service's behalf.
 */
export function createPolicyClient(options: { url: string; token: string; fetch?: FetchLike }): PolicyService {
  const send: FetchLike = options.fetch ?? fetch;
  const base = options.url.replace(/\/+$/, '');

  async function call<S extends z.ZodType>(method: 'GET' | 'POST', path: string, schema: S, body?: unknown): Promise<z.infer<S>> {
    const response = await send(`${base}${path}`, {
      method,
      headers: { authorization: `Bearer ${options.token}`, ...(body === undefined ? {} : { 'content-type': 'application/json' }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) throw new Error(`The policy service answered ${String(response.status)} to ${method} ${path}`);
    const parsed = schema.safeParse(await response.json());
    if (!parsed.success) throw new Error(`The policy service sent an answer in an unexpected shape to ${method} ${path}`);
    return parsed.data;
  }

  const agentPath = (path: string, agent: string): string => `${path}?${new URLSearchParams({ agent }).toString()}`;

  return {
    review: (request) => call('POST', POLICY_PATHS.review, ReviewResultSchema, request),
    applyAdminAction: (signed) => call('POST', POLICY_PATHS.admin, AdminResultSchema, { action: signed }),
    async currentMandate(agent) {
      return (await call('GET', agentPath(POLICY_PATHS.mandate, agent), MandateAnswerSchema)).mandate ?? undefined;
    },
    async todaysTotal(agent) {
      return (await call('GET', agentPath(POLICY_PATHS.today, agent), TodayAnswerSchema)).total;
    },
    async readLog() {
      return (await call('GET', POLICY_PATHS.log, LogAnswerSchema)).entries;
    },
    async clearDailyTotalsForDemo() {
      await call('POST', POLICY_PATHS.clearDailyTotals, DoneAnswerSchema);
    },
  };
}
