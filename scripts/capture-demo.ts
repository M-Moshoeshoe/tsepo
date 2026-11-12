import { mkdir } from 'node:fs/promises';
import { chromium, type Browser, type Page } from 'playwright';

/**
 * Drives the running interface like a person would and saves screenshots to
 * screenshots/. Start the app first (npm run build && npm start), and run this
 * with the access code in the environment (npm run demo:capture).
 *   node scripts/capture-demo.ts screens   every page at both widths, without running anything
 *   node scripts/capture-demo.ts all       Restore, the unknown agent and the split payment stories first, then every screenshot
 */
const BASE_URL = process.env.CAPTURE_URL ?? 'http://localhost:3000';
const ACCESS_CODE = process.env.DEMO_ACCESS_CODE ?? '';
const OUT = 'screenshots';
const RUN_TIMEOUT_MS = 240_000;
const PAGES: [string, string][] = [
  ['/', 'landing'],
  ['/business', 'overview'],
  ['/business/agent', 'agent'],
  ['/exchange/payments', 'payments'],
];

async function openPage(browser: Browser, width: number, reducedMotion: 'reduce' | 'no-preference' = 'reduce'): Promise<Page> {
  const context = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 }, reducedMotion });
  return context.newPage();
}

async function shot(page: Page, name: string, fullPage = true): Promise<void> {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage });
  console.log(`saved ${OUT}/${name}.png`);
}

function tour(page: Page) {
  return page.getByRole('complementary', { name: 'Guided tour' });
}

/** Opens the guided tour and enters the access code in its welcome step. The code is never printed. */
async function unlock(page: Page): Promise<void> {
  if (ACCESS_CODE === '') throw new Error('DEMO_ACCESS_CODE is not set in the environment');
  await page.getByRole('button', { name: 'Guided tour' }).click();
  await tour(page).getByLabel('Access code').fill(ACCESS_CODE);
  await tour(page).getByRole('button', { name: 'Unlock live steps' }).click();
  await tour(page).getByText('Live steps unlocked').waitFor();
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

async function goTo(page: Page, link: string): Promise<void> {
  await page.getByRole('link', { name: link, exact: true }).first().click();
}

/** Opens the first incoming payment and waits for its details panel. */
async function openFirstPayment(page: Page): Promise<void> {
  await page.getByRole('grid').getByRole('row').nth(1).click();
  await page.getByRole('dialog', { name: 'Payment details' }).waitFor({ timeout: 60_000 });
  await page.waitForTimeout(1500);
}

/** Restore, then two stories from the tour, with screenshots along the way. */
async function runStories(browser: Browser): Promise<void> {
  // Motion on, so the toast, the skeleton shimmer and the timeline behave as people see them.
  const page = await openPage(browser, 1280, 'no-preference');
  await page.goto(`${BASE_URL}/business`, { waitUntil: 'networkidle' });
  await unlock(page);
  await shot(page, 'tour-1280', false);

  await runAndWait(page, 'Restore sample data', () => tour(page).getByRole('button', { name: 'Restore sample data' }).click());
  await page.getByRole('status').getByText('Sample data restored').waitFor();
  await shot(page, 'toast-restored', false);

  await runAndWait(page, 'Unknown agent', () => tour(page).getByRole('button', { name: 'Run live: An unknown agent tries to pay' }).click());
  await runAndWait(page, 'Split payment', () => tour(page).getByRole('button', { name: 'Run live: Your agent tries to split a payment' }).click());
  await page.getByRole('heading', { name: 'What just happened' }).waitFor();
  await page.getByRole('button', { name: 'Close the guided tour' }).click();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await shot(page, 'overview-1280');
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

  // Moving within the app shows the loading skeleton while the page reads the ledger.
  await page.goto(`${BASE_URL}/exchange/payments`);
  await page.getByRole('grid').waitFor({ timeout: 60_000 });
  await shot(page, 'payments-1280');

  await openFirstPayment(page);
  await shot(page, 'payment-details-1280', false);
  await page.keyboard.press('Escape');
  await page.getByRole('dialog').waitFor({ state: 'detached' });

  await page.getByRole('navigation', { name: 'Filter payments' }).getByRole('link', { name: /Announced, not sent/ }).click();
  await page.waitForURL(/filter=refused/);
  await page.waitForLoadState('networkidle');
  await shot(page, 'payments-refused-1280');

  await page.getByRole('button', { name: /agent deposit address, what this means/ }).click();
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
    for (const [path, name] of PAGES) {
      await page.goto(`${BASE_URL}${path}`, { waitUntil: 'networkidle' });
      await shot(page, `${name}-${String(width)}`);
    }
    await openFirstPayment(page);
    await shot(page, `payment-details-${String(width)}`, false);
    await page.context().close();
  }
}

const mode = process.argv[2] ?? 'screens';
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  if (mode === 'all') {
    await runStories(browser);
    await screens(browser, false);
  } else {
    await screens(browser, true);
  }
} finally {
  await browser.close();
}
