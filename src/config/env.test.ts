import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Wallet } from 'xrpl';
import { loadEnv } from './env.ts';
import { ROLE_NAMES, ROLES } from './roles.ts';

const saved = { ...process.env };

beforeEach(() => {
  // Fresh keys in memory only; nothing is written anywhere.
  for (const role of ROLE_NAMES) process.env[ROLES[role].seedVar] = Wallet.generate().seed;
  delete process.env.AGENT_SOURCE_TAG;
  delete process.env.TSEPO_DATA_DIR;
});

afterEach(() => {
  process.env = { ...saved };
});

describe('data folder setting', () => {
  it('defaults to .data, also when the setting is empty', () => {
    expect(loadEnv().dataDir).toBe('.data');
    process.env.TSEPO_DATA_DIR = '';
    expect(loadEnv().dataDir).toBe('.data');
  });

  it('uses the folder it is given, such as a persistent volume', () => {
    process.env.TSEPO_DATA_DIR = '/data/tsepo';
    expect(loadEnv().dataDir).toBe('/data/tsepo');
  });
});
