import { mkdir } from 'node:fs/promises';
import { chromium, type Browser, type Page } from 'playwright';

/**
 * Drives the running interface like a person would and saves screenshots to
 * screenshots/. Start the app first (npm run build && npm start), and run this
 * with the demo access code in the environment (node --env-file=.env.local ...).
 *   node scripts/capture-demo.ts screens   the screens only
 *   node scripts/capture-demo.ts all       runs from the demo bar, then the screens
 */
const BASE_URL = process.env.CAPTURE_URL ?? 'http://localhost:3000';
const ACCESS_CODE = process.env.DEMO_ACCESS_CODE ?? '';
const OUT = 'screenshots';
const RUN_TIMEOUT_MS = 240_000;

/** Split payments first, then a reset, so the desk has runs before and since the last reset. */
const RUNS = ['Reset demo', 'Split payments', 'Reset demo', 'Unknown agent', 'Verified agent'];

async function openPage(browser: Browser, width: number): Promise<Page> {
  const context = await browser.newContext({
    viewport: { width, height: width < 600 ? 844 : 900 },
    // Reduced motion shows the finished check timeline, so screenshots are stable.
    reducedMotion: 'reduce',
  });
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

async function screens(browser: Browser): Promise<void> {
  for (const width of [1280, 390]) {
    const page = await openPage(browser, width);
    for (const screen of ['registry', 'compliance']) {
      await visit(page, `/${screen}`);
      await shot(page, `${screen}-${width}`);
    }
    if (width === 1280) {
      await visit(page, '/compliance?filter=refused');
      await shot(page, 'compliance-1280-refused');
    } else {
      await visit(page, '/compliance');
      await page.locator('tbody tr a').first().click();
      await page.getByRole('dialog', { name: 'Details' }).waitFor();
      await shot(page, 'compliance-390-details-open', false);
    }
    await page.context().close();
  }
}

const mode = process.argv[2] ?? 'screens';
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  if (mode === 'all') {
    const page = await openPage(browser, 1280);
    await visit(page, '/registry');
    for (const run of RUNS) await runFromBar(page, run);
    await page.context().close();
  }
  await screens(browser);
} finally {
  await browser.close();
}
