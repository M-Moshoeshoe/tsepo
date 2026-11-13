import { createHash, timingSafeEqual } from 'node:crypto';
import type { PolicyService } from './policy-service.ts';
import { AdminBodySchema, AgentQuerySchema, POLICY_PATHS, ReviewBodySchema } from './wire.ts';

export interface PolicyRequest {
  method: string;
  /** The path with its query, as the server received it. */
  url: string;
  /** The Authorization header, if any. */
  authorization: string | undefined;
  /** The raw body text. */
  body: string;
}

export interface PolicyResponse {
  status: number;
  body: unknown;
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

/** Compares the bearer token in constant time. Never logs either value. */
function authorised(header: string | undefined, token: string): boolean {
  if (header?.startsWith('Bearer ') !== true) return false;
  return timingSafeEqual(digest(header.slice('Bearer '.length)), digest(token));
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

const NOT_FOUND: PolicyResponse = { status: 404, body: { error: 'Not found' } };
const BAD_REQUEST: PolicyResponse = { status: 400, body: { error: 'The request is not well formed' } };

/**
 * The policy service's HTTP routes, with no network code: the server feeds
 * it requests, and tests call it directly. Every route but /health needs the
 * shared token. Bodies are untrusted and checked with Zod; the service itself
 * checks the payment again, refuses anything malformed, and reads the
 * credential from the ledger before it signs.
 */
export function createPolicyHandler(service: PolicyService, token: string): (request: PolicyRequest) => Promise<PolicyResponse> {
  return async (request) => {
    const url = new URL(request.url, 'http://policy.internal');
    const route = `${request.method} ${url.pathname}`;
    if (route === `GET ${POLICY_PATHS.health}`) return { status: 200, body: { ok: true } };
    if (!authorised(request.authorization, token)) return { status: 401, body: { error: 'Not authorised' } };

    const agent = (): string | undefined => {
      const parsed = AgentQuerySchema.safeParse({ agent: url.searchParams.get('agent') });
      return parsed.success ? parsed.data.agent : undefined;
    };

    switch (route) {
      case `POST ${POLICY_PATHS.review}`: {
        const body = ReviewBodySchema.safeParse(parseJson(request.body));
        if (!body.success) return BAD_REQUEST;
        return { status: 200, body: await service.review({ payment: body.data.payment, purpose: body.data.purpose }) };
      }
      case `POST ${POLICY_PATHS.admin}`: {
        const body = AdminBodySchema.safeParse(parseJson(request.body));
        if (!body.success) return BAD_REQUEST;
        return { status: 200, body: await service.applyAdminAction(body.data.action) };
      }
      case `GET ${POLICY_PATHS.mandate}`: {
        const address = agent();
        if (address === undefined) return BAD_REQUEST;
        return { status: 200, body: { mandate: (await service.currentMandate(address)) ?? null } };
      }
      case `GET ${POLICY_PATHS.today}`: {
        const address = agent();
        if (address === undefined) return BAD_REQUEST;
        return { status: 200, body: { total: await service.todaysTotal(address) } };
      }
      case `GET ${POLICY_PATHS.log}`:
        return { status: 200, body: { entries: await service.readLog() } };
      case `POST ${POLICY_PATHS.clearDailyTotals}`:
        await service.clearDailyTotalsForDemo();
        return { status: 200, body: { done: true } };
      default:
        return NOT_FOUND;
    }
  };
}
