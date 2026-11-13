import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Wallet } from 'xrpl';
import { loadPolicyServerEnv } from '../policy/server-env.ts';
import { loadAppEnv } from './app-env.ts';
import { ROLE_NAMES, ROLES } from './roles.ts';

const saved = { ...process.env };
const TOKEN = 'x'.repeat(40);

beforeEach(() => {
  // Fresh keys in memory only; nothing is written anywhere.
  for (const role of ROLE_NAMES) process.env[ROLES[role].seedVar] = Wallet.generate().seed;
  delete process.env.POLICY_SERVICE_URL;
  delete process.env.POLICY_SERVICE_TOKEN;
  delete process.env.POLICY_ADDRESS;
});

afterEach(() => {
  process.env = { ...saved };
});

describe('the app settings', () => {
  it('runs the policy service in-process with its key when no service URL is set', () => {
    expect(loadAppEnv().policy.mode).toBe('in-process');
  });

  it('reaches the policy service over the network, and holds no policy key, when a URL is set', () => {
    const address = Wallet.generate().address;
    delete process.env.POLICY_SEED;
    Object.assign(process.env, { POLICY_SERVICE_URL: 'http://policy.railway.internal:8080', POLICY_SERVICE_TOKEN: TOKEN, POLICY_ADDRESS: address });
    expect(loadAppEnv().policy).toEqual({ mode: 'service', url: 'http://policy.railway.internal:8080', token: TOKEN, address });
  });

  it('refuses to start with the policy key when the policy service runs on its own', () => {
    Object.assign(process.env, { POLICY_SERVICE_URL: 'http://policy.railway.internal:8080', POLICY_SERVICE_TOKEN: TOKEN, POLICY_ADDRESS: Wallet.generate().address });
    expect(() => loadAppEnv()).toThrow('POLICY_SEED must not be set');
  });

  it('names a missing or short setting, never its value', () => {
    delete process.env.POLICY_SEED;
    Object.assign(process.env, { POLICY_SERVICE_URL: 'http://policy.railway.internal:8080', POLICY_SERVICE_TOKEN: 'short-secret-value' });
    const message = (() => {
      try {
        loadAppEnv();
        return '';
      } catch (error: unknown) {
        return error instanceof Error ? error.message : '';
      }
    })();
    expect(message).toContain('POLICY_SERVICE_TOKEN');
    expect(message).toContain('POLICY_ADDRESS');
    expect(message).not.toContain('short-secret-value');
  });
});

describe('the policy service settings', () => {
  it('needs only its own key, the issuer address and the token', () => {
    const seed = Wallet.generate().seed ?? '';
    const issuer = Wallet.generate().address;
    expect(loadPolicyServerEnv({ POLICY_SEED: seed, ISSUER_ADDRESS: issuer, POLICY_SERVICE_TOKEN: TOKEN, PORT: '8080' })).toEqual({
      seed,
      issuerAddress: issuer,
      token: TOKEN,
      dataDir: '.data',
      port: 8080,
    });
  });

  it('names what is missing without printing any value', () => {
    expect(() => loadPolicyServerEnv({ POLICY_SEED: 'not-a-seed' })).toThrow(/POLICY_SEED.*ISSUER_ADDRESS.*POLICY_SERVICE_TOKEN/);
  });
});
