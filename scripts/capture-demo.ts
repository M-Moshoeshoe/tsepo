import { mkdir } from 'node:fs/promises';
import { chromium, type Browser, type Page } from 'playwright';

/**
 * Drives the running interface like a person would and saves screenshots to
 * screenshots/. Start the app first (npm run build && npm start), and run this
 * with the demo access code in the environment (npm run demo:capture).
 *   node scripts/capture-demo.ts screens   every page at both widths, without running anything
 *   node scripts/capture-demo.ts all       Reset, scenario 1 and scenario 3 first, then every screenshot
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

/** Enters the access code through the dialog that a locked demo action opens. The code is never printed. */
async function unlock(page: Page): Promise<void> {
  if (ACCESS_CODE === '') throw new Error('DEMO_ACCESS_CODE is not set in the environment');
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Enter the demo access code' });
  await dialog.waitFor();
  await dialog.locator('input[type="password"]').fill(ACCESS_CODE);
  await page.getByRole('button', { name: 'Unlock the demo' }).click();
  await dialog.waitFor({ state: 'detached' });
}

/** Starts a run with `start` and waits until it has fully finished. Stops on any failure. */
async function runAndWait(page: Page, name: string, start: () => Promise<void>): Promise<void> {
  const close = page.getByRole('region', { name: 'Run progress' }).getByRole('button', { name: 'Close', exact: true });
  if (await close.isVisible()) await close.click();
  await start();
  const progress = page.getByRole('region', { name: 'Run progress' });
  await progress.getByText(/Running|Finished in|Stopped after/).first().waitFor({ timeout: 10_000 });
  const finished = progress.getByText(/Finished in \d+ seconds|Stopped after \d+ seconds/);
  await finished.waitFor({ timeout: RUN_TIMEOUT_MS });
  if ((await finished.textContent())?.startsWith('Stopped') === true) {
    await shot(page, 'run-stopped');
    throw new Error(`The run "${name}" stopped. See screenshots/run-stopped.png.`);
  }
  await close.waitFor({ timeout: RUN_TIMEOUT_MS });
  await page.waitForLoadState('networkidle');
  console.log(`ran ${name}`);
}

async function goTo(page: Page, link: 'Home' | 'Agent' | 'Compliance desk'): Promise<void> {
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: link }).click();
}

/** Opens the first payment on the desk and waits for its slideout. */
async function openFirstPayment(page: Page): Promise<void> {
  await page.getByRole('grid').getByRole('row').nth(1).click();
  await page.getByRole('dialog', { name: 'Payment details' }).waitFor({ timeout: 60_000 });
  await page.waitForTimeout(1500);
}

/** Reset, scenario 1 from the runbook and scenario 3 from the header menu, with screenshots along the way. */
async function runScenarios(browser: Browser): Promise<void> {
  // Motion on, so the toast, the skeleton shimmer and the timeline behave as people see them.
  const page = await openPage(browser, 1280, 'no-preference');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  await unlock(page);

  await runAndWait(page, 'Reset', () => page.getByRole('button', { name: 'Reset', exact: true }).click());
  await page.getByRole('status').getByText('Demo reset').waitFor();
  await shot(page, 'toast-demo-reset', false);

  await runAndWait(page, 'Scenario 1', () => page.getByRole('button', { name: 'Run Scenario 1: Unknown agent' }).click());
  await runAndWait(page, 'Scenario 3', async () => {
    await page.getByRole('button', { name: 'Run scenario', exact: true }).click();
    await page.getByRole('menuitem', { name: 'Scenario 3: Split payments' }).click();
  });
  await page.getByRole('heading', { name: 'What just happened' }).waitFor();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await shot(page, 'home-1280');
  await page.emulateMedia({ reducedMotion: 'no-preference' });

  await goTo(page, 'Agent');
  await page.getByRole('heading', { name: 'Approved recipients' }).waitFor({ timeout: 60_000 });
  await shot(page, 'agent-1280');
  await page.getByRole('button', { name: 'Change limits' }).click();
  await page.getByRole('dialog', { name: 'Change the agent limits' }).waitFor();
  await page.waitForTimeout(400);
  await shot(page, 'change-limits-dialog', false);
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'detached' });

  // Moving within the app shows the loading skeleton while the desk reads the ledger.
  await goTo(page, 'Compliance desk');
  await page.locator('[aria-busy="true"]').waitFor({ timeout: 10_000 });
  await shot(page, 'loading-skeleton', false);
  await page.getByRole('grid').waitFor({ timeout: 60_000 });
  await shot(page, 'desk-1280');

  await openFirstPayment(page);
  await shot(page, 'desk-slideout-1280', false);
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'detached' });

  await page.getByRole('tab', { name: /Refused/ }).first().click();
  await page.waitForURL(/filter=refused/);
  await page.waitForLoadState('networkidle');
  await shot(page, 'desk-refused-1280');

  await page.getByRole('button', { name: /agent lane, what this means/ }).click();
  await page.getByRole('dialog').waitFor();
  await page.waitForTimeout(400);
  await shot(page, 'tooltip-open', false);
  await page.context().close();
}

/** Every page at phone width, and the desktop pages when no run was made first. */
async function screens(browser: Browser, includeDesktop: boolean): Promise<void> {
  const widths = includeDesktop ? [1280, 390] : [390];
  for (const width of widths) {
    const page = await openPage(browser, width);
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await shot(page, `home-${String(width)}`);
    await page.goto(`${BASE_URL}/agent`, { waitUntil: 'networkidle' });
    await shot(page, `agent-${String(width)}`);
    await page.goto(`${BASE_URL}/compliance`, { waitUntil: 'networkidle' });
    await shot(page, `desk-${String(width)}`);
    await openFirstPayment(page);
    await shot(page, `desk-slideout-${String(width)}`, false);
    await page.context().close();
  }
}

const mode = process.argv[2] ?? 'screens';
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  if (mode === 'all') {
    await runScenarios(browser);
    await screens(browser, false);
  } else {
    await screens(browser, true);
  }
} finally {
  await browser.close();
}
