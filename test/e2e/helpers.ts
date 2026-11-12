import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { createRequire } from 'node:module';
import { chromium, type Browser, type Page } from 'playwright';
import { z } from 'zod';
import { ACCESS_CODE_HEADER, DemoEventSchema, type DemoEvent, type RunRequest } from '../../src/demo/events.ts';

export const BASE_URL = process.env.E2E_URL ?? 'http://localhost:3000';

/** The demo access code from the environment. Never printed. */
export function accessCode(): string {
  const code = process.env.DEMO_ACCESS_CODE ?? '';
  if (code.length < 6) throw new Error('DEMO_ACCESS_CODE is not set in the environment');
  return code;
}

/** Runs one demo action through the real run endpoint and returns every event it streamed. */
export async function runThroughApi(request: RunRequest, base = BASE_URL): Promise<DemoEvent[]> {
  const response = await fetch(`${base}/api/runs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', [ACCESS_CODE_HEADER]: accessCode() },
    body: JSON.stringify(request),
  });
  if (!response.ok) throw new Error(`The run endpoint answered ${String(response.status)}: ${await response.text()}`);
  const text = await response.text();
  return text
    .trim()
    .split('\n')
    .map((line) => DemoEventSchema.parse(JSON.parse(line)));
}

export function lastEvent(events: DemoEvent[]): DemoEvent | undefined {
  return events.at(-1);
}

export async function openBrowser(): Promise<Browser> {
  return chromium.launch();
}

export async function openPage(browser: Browser, width: number, base = BASE_URL, path = '/'): Promise<Page> {
  const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(`${base}${path}`, { waitUntil: 'networkidle' });
  return page;
}

const AxeResultSchema = z.array(z.object({ id: z.string(), impact: z.string().nullable().optional(), nodes: z.array(z.unknown()) }));

/** Runs axe on the page as it is now and returns the violations as "impact id" strings. */
export async function axeViolations(page: Page): Promise<string[]> {
  const require = createRequire(import.meta.url);
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  const raw: unknown = await page.evaluate(async () => {
    const axe = (window as unknown as { axe: { run: (context: Document) => Promise<{ violations: unknown[] }> } }).axe;
    return (await axe.run(document)).violations;
  });
  return AxeResultSchema.parse(raw).map((violation) => `${violation.impact ?? 'unknown'} ${violation.id}`);
}

/** The text every page shows when a server component fails. A page that shows it has crashed. */
export const PAGE_ERROR_TEXT = 'This screen could not read the ledger or the service records.';

/** Starts a second production server, for example with an empty data folder. Stops it with `stopServer`. */
export async function startServer(port: number, env: Record<string, string>): Promise<ChildProcess> {
  // One command string: the port is a number we choose, so nothing outside reaches the shell.
  const child = spawn(`npx next start -p ${String(port)}`, { env: { ...process.env, ...env }, shell: true, stdio: 'ignore' });
  const base = `http://localhost:${String(port)}`;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`${base}/icon.svg`);
      if (response.ok) return child;
    } catch {
      // Not listening yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  stopServer(child);
  throw new Error(`The second server did not start on port ${String(port)}`);
}

export function stopServer(child: ChildProcess): void {
  if (child.pid === undefined) return;
  if (process.platform === 'win32') spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  else child.kill('SIGTERM');
}
