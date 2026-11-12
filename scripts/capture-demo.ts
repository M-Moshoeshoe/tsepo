import { mkdir } from 'node:fs/promises';
import { chromium, type Browser, type Page } from 'playwright';

/**
 * Drives the running interface like a person would and saves screenshots to
 * screenshots/. Start the app first (npm run build && npm start), and run this
 * with the demo access code in the environment (npm run demo:capture).
 *   node scripts/capture-demo.ts screens   the overview only
 *   node scripts/capture-demo.ts all       Reset and scenario 3 from the demo bar, then every screenshot
 */
const BASE_URL = process.env.CAPTURE_URL ?? 'http://localhost:3000';
const ACCESS_CODE = process.env.DEMO_ACCESS_CODE ?? '';
const OUT = 'screenshots';
const RUN_TIMEOUT_MS = 240_000;

async function openPage(browser: Browser, width: number, reducedMotion: 'reduce' | 'no-preference' = 'reduce'): Promise<Page> {
  const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 }, reducedMotion });
  return context.newPage();
}

async function shot(page: Page, name: string, fullPage = true): Promise<void> {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
  console.log(`saved ${OUT}/${name}.png`);
}

/** Enters the access code once per browser session. The code is never printed. */
async function unlock(page: Page): Promise<void> {
  const input = page.locator('#demo-access-code');
  if (!(await input.isVisible())) return;
  if (ACCESS_CODE === '') throw new Error('DEMO_ACCESS_CODE is not set in the environment');
  await input.fill(ACCESS_CODE);
  await page.getByRole('button', { name: 'Unlock the demo controls' }).click();
  await page.getByRole('button', { name: 'Reset demo' }).waitFor();
}

async function visit(page: Page, path: string): Promise<void> {
  await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
  await unlock(page);
}

/** Clicks a demo bar button and waits until that run has fully closed. Stops on any failure. */
async function runFromBar(page: Page, button: string): Promise<void> {
  const close = page.getByRole('button', { name: 'Close', exact: true });
  if (await close.isVisible()) await close.click();
  await page.getByRole('button', { name: button, exact: false }).first().click();
  const progress = page.getByRole('region', { name: 'Run progress' });
  await progress.getByText(/Running|Finished in|Stopped after/).first().waitFor({ timeout: 10_000 });
  const finished = progress.getByText(/Finished in \d+ seconds|Stopped after \d+ seconds/);
  await finished.waitFor({ timeout: RUN_TIMEOUT_MS });
  if ((await finished.textContent())?.startsWith('Stopped') === true) {
    await shot(page, 'run-stopped');
    throw new Error(`The run "${button}" stopped. See screenshots/run-stopped.png.`);
  }
  await close.waitFor({ timeout: RUN_TIMEOUT_MS });
  console.log(`ran ${button}`);
}

async function overview(browser: Browser): Promise<void> {
  for (const width of [1280, 390]) {
    const page = await openPage(browser, width);
    await visit(page, '/');
    await shot(page, `overview-${width}`);
    await page.context().close();
  }
}

async function scenarioThree(browser: Browser): Promise<void> {
  // Motion on, so the toast, the skeleton shimmer and the timeline behave as people see them.
  const page = await openPage(browser, 1280, 'no-preference');
  await visit(page, '/registry');

  await runFromBar(page, 'Reset demo');
  await page.getByRole('status').getByText('Demo reset').waitFor();
  await shot(page, 'toast-demo-reset', false);

  await runFromBar(page, 'Split payments');
  await page.getByRole('heading', { name: 'What just happened' }).waitFor();
  await page.waitForLoadState('networkidle');
  await shot(page, 'scenario-3-registry');

  // Moving within the app keeps the panel, and shows the loading skeleton while the desk reads the ledger.
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Compliance desk' }).click();
  await page.locator('[aria-busy="true"]').waitFor({ timeout: 10_000 });
  await shot(page, 'loading-skeleton', false);
  // The skeleton also has a Details title, so wait for the loaded Checks heading, then for the timeline to finish.
  await page.getByRole('heading', { name: 'Checks' }).waitFor({ timeout: 60_000 });
  await page.waitForTimeout(1500);
  // The browser does not animate the part of a full-page shot below the fold, so show the finished timeline.
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await shot(page, 'scenario-3-compliance');
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  await page.getByRole('button', { name: /agent lane, what this means/ }).click();
  await page.getByRole('dialog').waitFor();
  // Let the short fade finish before the screenshot.
  await page.waitForTimeout(400);
  await shot(page, 'tooltip-open', false);
  await page.context().close();
}

const mode = process.argv[2] ?? 'screens';
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  if (mode === 'all') await scenarioThree(browser);
  await overview(browser);
} finally {
  await browser.close();
}
