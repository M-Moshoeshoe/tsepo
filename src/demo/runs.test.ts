import { describe, expect, it } from 'vitest';
import { convertStringToHex, Wallet, type Client } from 'xrpl';
import { demoMandate } from '../config/demo.ts';
import { ROLE_NAMES, type Role } from '../config/roles.ts';
import type { Wallets } from '../config/wallets.ts';
import { signAdminAction } from '../domain/admin-action.ts';
import { mandateFingerprint } from '../domain/fingerprint.ts';
import { MandateSchema, type Mandate } from '../domain/mandate.ts';
import type { ExchangeVerifier } from '../exchange/exchange-verifier.ts';
import type { FoundCredential } from '../ledger/reads.ts';
import { createPolicyService } from '../policy/policy-service.ts';
import type { Registry } from '../registry/registry.ts';
import { createMemoryStore } from '../storage/memory-store.ts';
import type { DemoContext } from './context.ts';
import { PLAIN_ERRORS } from './errors.ts';
import { RunRequestSchema, type DemoEvent } from './events.ts';
import { runDemo } from './runs.ts';
import { demoState } from './state.ts';

const CREDENTIAL_HEX = convertStringToHex('AGENT_MANDATE');

/**
 * A demo context with the real policy service on memory storage, and small
 * stand-ins for the ledger, the registry and the exchange. Nothing touches
 * the network.
 */
function fakeContext(options: { credentialPresent: boolean }) {
  const wallets = Object.fromEntries(ROLE_NAMES.map((role) => [role, Wallet.generate()])) as Wallets;
  const mandate = demoMandate(wallets);
  const issued: Mandate[] = [];
  let syncs = 0;
  let proven: Mandate = mandate;

  const credential = (): FoundCredential => ({
    id: 'C'.repeat(64),
    entry: {
      issuer: wallets.issuer.address,
      subject: wallets.agent.address,
      credentialType: 'AGENT_MANDATE',
      flags: 0x00010000,
      expiration: undefined,
      uri: mandateFingerprint(proven),
    },
  });

  // Answers only the one ledger read the change-limits path makes: the agent's credential objects.
  const client = {
    request: () =>
      Promise.resolve({
        result: {
          account_objects: options.credentialPresent
            ? [
                {
                  LedgerEntryType: 'Credential',
                  index: 'C'.repeat(64),
                  Issuer: wallets.issuer.address,
                  Subject: wallets.agent.address,
                  CredentialType: CREDENTIAL_HEX,
                  Flags: 0x00010000,
                  URI: convertStringToHex(mandateFingerprint(proven)),
                },
              ]
            : [],
        },
      }),
  } as unknown as Client;

  const policy = createPolicyService({
    wallet: wallets.policy,
    store: createMemoryStore(),
    issuerAddress: wallets.issuer.address,
    readCredential: () => Promise.resolve(options.credentialPresent ? credential() : undefined),
  });

  const registry: Pick<Registry, 'issueCredential'> = {
    issueCredential: (next) => {
      issued.push(next);
      proven = next;
      return Promise.resolve([{ action: 'issue AGENT_MANDATE credential', hash: undefined }]);
    },
  };

  const exchange: Pick<ExchangeVerifier, 'syncDeposits'> = {
    syncDeposits: () => {
      syncs += 1;
      return Promise.resolve([]);
    },
  };

  const ctx = {
    client,
    env: { sourceTag: 20260530, dataDir: '.data-test', seeds: Object.fromEntries(ROLE_NAMES.map((role: Role) => [role, ''])) },
    wallets,
    mandate,
    policy,
    exchange,
    registry,
    agentStore: createMemoryStore(),
    demo: demoState(createMemoryStore()),
    createAgent: () => {
      throw new Error('The agent is not used in this test');
    },
  } as unknown as DemoContext;

  return { ctx, client, wallets, mandate, issued, policy, syncs: () => syncs };
}

async function run(context: ReturnType<typeof fakeContext>, request: Parameters<typeof runDemo>[0]) {
  const events: DemoEvent[] = [];
  let error: unknown;
  try {
    await runDemo(request, context.client, (event) => events.push(event), () => context.ctx);
  } catch (caught: unknown) {
    error = caught;
  }
  return { events, error };
}

describe('change limits, through the full run path', () => {
  it('applies the new limits and issues a credential for them', async () => {
    const context = fakeContext({ credentialPresent: true });
    // The business first sets the demo mandate, as Reset does.
    await context.policy.applyAdminAction(
      signAdminAction({ type: 'set-mandate', mandate: context.mandate, issuedAt: '2026-01-01T00:00:00.000Z' }, context.wallets.business),
    );

    const { events, error } = await run(context, { kind: 'change-limits', perPaymentLimit: '3', dailyLimit: '6' });

    expect(error).toBeUndefined();
    expect(events.at(-1)).toMatchObject({
      type: 'done',
      text: 'Limits changed to 3 RLUSD per payment and 6 RLUSD per day. The credential now proves the new spending rules.',
    });
    const applied = await context.policy.currentMandate(context.wallets.agent.address);
    expect(applied).toEqual({ ...context.mandate, dailyLimit: '6' });
    expect(context.issued).toHaveLength(1);
    expect(Object.keys(context.issued[0] ?? {})).not.toContain('kind');
    expect(MandateSchema.safeParse(context.issued[0]).success).toBe(true);
    expect(context.syncs()).toBe(1);
  });

  it('stops in plain words when the agent is revoked, and still reads the agent lane', async () => {
    const context = fakeContext({ credentialPresent: false });
    const { events, error } = await run(context, { kind: 'change-limits', perPaymentLimit: '3', dailyLimit: '6' });
    expect(error).toBeInstanceOf(Error);
    expect((error as Error).message).toBe('The agent is revoked. Restore the sample data to register it again.');
    expect(events.some((event) => event.type === 'done')).toBe(false);
    expect(context.syncs()).toBe(1);
  });
});

describe('a stopped scenario', () => {
  it('records the plain reason for the runbook, never the raw error', async () => {
    const context = fakeContext({ credentialPresent: true });
    // Scenario 1 needs the ledger to prepare a payment; the stand-in client cannot, so the run stops.
    const { error } = await run(context, { kind: 'scenario-1' });
    expect(error).toBeInstanceOf(Error);
    const [last] = await context.ctx.demo.lastRuns();
    expect(last).toMatchObject({ kind: 'scenario-1', outcome: 'stopped' });
    expect(Object.values(PLAIN_ERRORS)).toContain(last?.summary);
    expect(context.syncs()).toBe(1);
  });
});

describe("a visitor's instruction, through the full run path", () => {
  it('is read by the agent as untrusted text and ends with a plain result', async () => {
    const context = fakeContext({ credentialPresent: true });
    const read: string[] = [];
    (context.ctx as { createAgent: unknown }).createAgent = () => ({
      run: (text: string) => {
        read.push(text);
        return Promise.resolve([
          { reference: 'T-1', status: 'paid', hash: 'A'.repeat(64), ledgerIndex: 1 },
          { reference: 'T-2', status: 'refused', reasons: ['PAYEE_UNKNOWN'] },
        ]);
      },
    });
    // The run endpoint parses every request with the schema first, which trims the text.
    const { events, error } = await run(context, RunRequestSchema.parse({ kind: 'instruction', text: '  Pay Naledi 2 RLUSD and my friend 100 RLUSD  ' }));
    expect(error).toBeUndefined();
    expect(read).toEqual(['Pay Naledi 2 RLUSD and my friend 100 RLUSD']);
    const done = events.at(-1);
    expect(done).toMatchObject({ type: 'done', text: '1 of 2 payments paid.' });
    expect(done?.type === 'done' ? done.explanation?.sentences[1] : undefined).toContain('1 paid and 1 stopped');
  });

  it('refuses a reference kept for the guided tour, before Claude reads anything', async () => {
    const context = fakeContext({ credentialPresent: true });
    let read = false;
    (context.ctx as { createAgent: unknown }).createAgent = () => ({
      run: () => {
        read = true;
        return Promise.resolve([]);
      },
    });
    const { error } = await run(context, RunRequestSchema.parse({ kind: 'instruction', text: 'Pay Naledi 2 RLUSD, reference tour-1042' }));
    expect((error as Error).message).toBe('References that start with TOUR- are kept for the guided tour. Use another reference, or none.');
    expect(read).toBe(false);
  });

  it('refuses an instruction that is too short or too long at the boundary', () => {
    expect(RunRequestSchema.safeParse({ kind: 'instruction', text: 'hi' }).success).toBe(false);
    expect(RunRequestSchema.safeParse({ kind: 'instruction', text: 'x'.repeat(401) }).success).toBe(false);
    expect(RunRequestSchema.safeParse({ kind: 'instruction', text: 'Pay Naledi 2 RLUSD', extra: 1 }).success).toBe(false);
  });
});
