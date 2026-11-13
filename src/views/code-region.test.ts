import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { codeRegion } from './code-region.ts';
import { INTEGRATION_REGIONS } from './integration.ts';

const EXAMPLE = readFileSync('examples/exchange-integration.ts', 'utf8');
const SAMPLE = JSON.parse(readFileSync('examples/sample-travel-rule-details.json', 'utf8')) as { details: { agent: { credentialIssuer: string } } };

describe('code regions', () => {
  it('cuts a region out and removes its common indentation', () => {
    const source = ['a', '  // #region demo', '  const x = 1;', '    return x;', '  // #endregion demo', 'b'].join('\n');
    expect(codeRegion(source, 'demo')).toBe('const x = 1;\n  return x;');
  });

  it('fails on a missing region instead of showing nothing', () => {
    expect(() => codeRegion('no regions here', 'demo')).toThrow('missing');
  });

  it('finds every region the Integrate page shows in the runnable example', () => {
    for (const region of INTEGRATION_REGIONS) expect(codeRegion(EXAMPLE, region).length, region).toBeGreaterThan(0);
  });

  it('names the same Tšepo issuer as the real Travel Rule details the example matches', () => {
    expect(codeRegion(EXAMPLE, 'constants')).toContain(`'${SAMPLE.details.agent.credentialIssuer}'`);
  });
});
