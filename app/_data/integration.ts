import 'server-only';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { codeRegion } from '../../src/views/code-region.ts';
import { INTEGRATION_REGIONS, type IntegrationRegion } from '../../src/views/integration.ts';

/** The code the Integrate page shows, cut from the runnable example itself, so the page and the script can never differ. */
export function integrationCode(): Record<IntegrationRegion, string> {
  const source = readFileSync(join(process.cwd(), 'examples', 'exchange-integration.ts'), 'utf8');
  return Object.fromEntries(INTEGRATION_REGIONS.map((region) => [region, codeRegion(source, region)])) as Record<IntegrationRegion, string>;
}
