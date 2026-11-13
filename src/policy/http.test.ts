import { unixTimeToRippleTime, Wallet } from 'xrpl';
import { beforeEach, describe, expect, it } from 'vitest';
import { makeMandate, makeParties, makePayment, type Parties } from '../../test/fixtures.ts';
import { signAdminAction } from '../domain/admin-action.ts';
import { fingerprintToInvoiceId, mandateFingerprint } from '../domain/fingerprint.ts';
import type { Mandate } from '../domain/mandate.ts';
import { AdminReason, PolicyReason } from '../domain/reasons.ts';
import { RLUSD } from '../ledger/testnet.ts';
import { createMemoryStore } from '../storage/memory-store.ts';
import { createPolicyClient, type FetchLike } from './http-client.ts';
import { createPolicyHandler } from './http-handler.ts';
import { createPolicyService, type PolicyService } from './policy-service.ts';

const TOKEN = 'a-test-token-that-is-at-least-32-characters';
const now = new Date('2026-11-12T10:00:00Z');

let parties: Parties;
let mandate: Mandate;
let remote: PolicyService;
let handle: ReturnType<typeof createPolicyHandler>;

/** A fetch that calls the handler directly, as the server would, so the round trip needs no network. */
function fetchThrough(): FetchLike {
  return async (input, init) => {
    const url = new URL(input);
    const answer = await handle({
      method: init.method,
      url: `${url.pathname}${url.search}`,
      authorization: init.headers.authorization,
      body: init.body ?? '',
    });
    return { ok: answer.status < 300, status: answer.status, json: () => Promise.resolve(JSON.parse(JSON.stringify(answer.body)) as unknown) };
  };
}

function rlusd(value: string): Record<string, string> {
  return { currency: RLUSD.currency, issuer: RLUSD.issuer, value };
}

beforeEach(async () => {
  parties = makeParties();
  mandate = makeMandate(parties);
  const service = createPolicyService({
    wallet: Wallet.generate(),
    store: createMemoryStore(),
    issuerAddress: parties.issuer.address,
    readCredential: () =>
      Promise.resolve({
        id: 'C'.repeat(64),
        entry: {
          issuer: parties.issuer.address,
          subject: parties.agent.address,
          credentialType: 'AGENT_MANDATE',
          flags: 0x00010000,
          expiration: unixTimeToRippleTime(Date.parse('2099-01-01T00:00:00Z')),
          uri: mandateFingerprint(mandate),
        },
      }),
    now: () => now,
  });
  handle = createPolicyHandler(service, TOKEN);
  remote = createPolicyClient({ url: 'http://policy.internal:8080/', token: TOKEN, fetch: fetchThrough() });
  expect(await remote.applyAdminAction(signAdminAction({ type: 'set-mandate', mandate, issuedAt: '2026-11-12T09:00:00.000Z' }, parties.business))).toEqual({
    applied: true,
  });
});

describe('the policy service over HTTP', () => {
  it('co-signs a payment within the mandate and refuses one over the limit, as in-process', async () => {
    const within = makePayment(parties, { InvoiceID: fingerprintToInvoiceId(`sha256:${'1'.repeat(64)}`), Amount: rlusd('2') });
    const signed = await remote.review({ payment: within, purpose: 'Logo design' });
    expect(signed.decision).toBe('signed');

    const over = makePayment(parties, { InvoiceID: fingerprintToInvoiceId(`sha256:${'2'.repeat(64)}`), Amount: rlusd('1000') });
    expect(await remote.review({ payment: over, purpose: 'Too much' })).toMatchObject({ decision: 'refused', reasons: expect.arrayContaining([PolicyReason.OverPerPaymentLimit]) as unknown });
  });

  it('reads the mandate, the day total and the log through the client', async () => {
    expect(await remote.currentMandate(parties.agent.address)).toEqual(mandate);
    expect(await remote.currentMandate(Wallet.generate().address)).toBeUndefined();
    expect(await remote.todaysTotal(parties.agent.address)).toBe('0');
    expect((await remote.readLog()).some((entry) => entry.kind === 'admin' && entry.decision === 'applied')).toBe(true);
    await remote.clearDailyTotalsForDemo();
  });

  it('rejects an admin action the business did not sign', async () => {
    const raised = { ...mandate, dailyLimit: '1000' };
    expect(await remote.applyAdminAction(signAdminAction({ type: 'set-mandate', mandate: raised, issuedAt: '2026-11-12T09:30:00.000Z' }, parties.agent))).toEqual({
      applied: false,
      reason: AdminReason.SignerNotPrincipal,
    });
  });

  it('answers nothing but /health without the token, and the client fails closed', async () => {
    expect(await handle({ method: 'GET', url: '/health', authorization: undefined, body: '' })).toEqual({ status: 200, body: { ok: true } });
    expect((await handle({ method: 'GET', url: '/log', authorization: undefined, body: '' })).status).toBe(401);
    expect((await handle({ method: 'GET', url: '/log', authorization: 'Bearer wrong-token', body: '' })).status).toBe(401);
    const intruder = createPolicyClient({ url: 'http://policy.internal:8080', token: 'wrong-token-that-is-long-enough-to-pass', fetch: fetchThrough() });
    await expect(intruder.readLog()).rejects.toThrow('401');
  });

  it('refuses malformed bodies and unknown routes without calling the service', async () => {
    const auth = `Bearer ${TOKEN}`;
    expect((await handle({ method: 'POST', url: '/review', authorization: auth, body: 'not json' })).status).toBe(400);
    expect((await handle({ method: 'GET', url: '/mandate?agent=not-an-address', authorization: auth, body: '' })).status).toBe(400);
    expect((await handle({ method: 'DELETE', url: '/log', authorization: auth, body: '' })).status).toBe(404);
  });

  it('fails closed on an answer in an unexpected shape', async () => {
    const odd = createPolicyClient({
      url: 'http://policy.internal:8080',
      token: TOKEN,
      fetch: () => Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ decision: 'signed', signature: 'not hex!' }) }),
    });
    await expect(odd.review({ payment: {}, purpose: 'x' })).rejects.toThrow('unexpected shape');
  });
});
