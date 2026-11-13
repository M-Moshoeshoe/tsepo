/**
 * Fails the build if any secret value reached the files a browser downloads.
 * Runs after next build: node scripts/check-secrets.ts
 *
 * It reads each secret from the environment and searches every file under
 * .next/static for it. It prints only the name of a leaked variable and the
 * file, never the value. Secrets missing from this environment are skipped,
 * so the check needs no secrets of its own.
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ROLE_NAMES, ROLES } from '../src/config/roles.ts';

const STATIC_DIR = '.next/static';
/** Shorter values could match ordinary text by chance. */
const MIN_LENGTH = 6;

const SECRET_NAMES = [...ROLE_NAMES.map((role) => ROLES[role].seedVar), 'ANTHROPIC_API_KEY', 'DEMO_ACCESS_CODE', 'POLICY_SERVICE_TOKEN'];

async function filesUnder(folder: string): Promise<string[]> {
  const entries = await readdir(folder, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map((entry) => (entry.isDirectory() ? filesUnder(join(folder, entry.name)) : Promise.resolve([join(folder, entry.name)]))),
  );
  return nested.flat();
}

const secrets = SECRET_NAMES.flatMap((name) => {
  const value = process.env[name];
  return value !== undefined && value.length >= MIN_LENGTH ? [{ name, value }] : [];
});

const files = await filesUnder(STATIC_DIR);
const leaks: string[] = [];
for (const file of files) {
  const text = await readFile(file, 'utf8');
  for (const secret of secrets) if (text.includes(secret.value)) leaks.push(`${secret.name} in ${file}`);
}

if (leaks.length > 0) {
  console.error(`Secret scan failed. These values reached the browser files:\n${leaks.join('\n')}`);
  process.exit(1);
}
console.log(`Secret scan passed: ${String(secrets.length)} secrets checked in ${String(files.length)} browser files, none found.`);
