import { mkdir } from 'node:fs/promises';
import { chromium, type Browser, type Page } from 'playwright';

/**
 * Drives the running interface like a person would and saves screenshots to
 * screenshots/. Start the app first (npm run build && npm start).
 *   node scripts/capture-demo.ts screens   only the two screens, at 1280px and 390px
 *   node scripts/capture-demo.ts all       Reset and each of the four scenarios from the demo bar, then the screens
 */
const BASE_URL = process.env.CAPTURE_URL ?? 'http://localhost:3000';
const OUT = 'screenshots';
const RUN_TIMEOUT_MS = 240_000;

const SCENARIOS = [
  { number: 1, button: 'Unknown agent', screens: ['compliance'] },
  { number: 2, button: 'Verified agent', screens: ['registry', 'compliance'] },
  { number: 3, button: 'Split payments', screens: ['registry', 'compliance'] },
  { number: 4, button: 'Revoke', screens: ['registry', 'compliance'] },
] as const;

async function openPage(browser: Browser, width: number): Promise<Page> {
  const context = await browser.newContext({
    viewport: { width, height: width < 600 ? 844 : 900 },
    // Reduced motion shows the finished check timeline, so screenshots are stable.
    reducedMotion: 'reduce',
  });
  return context.newPage();
}

async function shot(page: Page, name: string): Promise<void> {
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log(`saved ${OUT}/${name}.png`);
}

/** Clicks a demo bar button and waits until the run reports that it finished. Stops on any failure. */
async function runFromBar(page: Page, button: string): Promise<void> {
  // Close the previous run's panel first, so its result is never mistaken for this run's.
  const close = page.getByRole('button', { name: 'Close', exact: true });
  if (await close.isVisible()) await close.click();
  await page.getByRole('button', { name: button, exact: false }).first().click();
  const progress = page.getByRole('region', { name: 'Run progress' });
  await progress.getByText(/Running|Finished in|Stopped after/).first().waitFor({ timeout: 10_000 });
  const finished = progress.getByText(/Finished in \d+ seconds|Stopped after \d+ seconds/);
  await finished.waitFor({ timeout: RUN_TIMEOUT_MS });
  if ((await finished.textContent())?.startsWith('Stopped') === true) {
    throw new Error(`The run "${button}" stopped. See the screenshot of the progress panel.`);
  }
  // Close appears only once the run's connection has fully closed and the controls are free again.
  await close.waitFor({ timeout: RUN_TIMEOUT_MS });
  await page.waitForLoadState('networkidle');
}

async function screens(browser: Browser, suffix = ''): Promise<void> {
  for (const width of [1280, 390]) {
    const page = await openPage(browser, width);
    for (const screen of ['registry', 'compliance']) {
      await page.goto(`${BASE_URL}/${screen}`, { waitUntil: 'networkidle' });
      await shot(page, `${screen}-${width}${suffix}`);
    }
    await page.context().close();
  }
}

async function scenarios(browser: Browser): Promise<void> {
  const page = await openPage(browser, 1280);
  await page.goto(`${BASE_URL}/registry`, { waitUntil: 'networkidle' });
  for (const scenario of SCENARIOS) {
    await runFromBar(page, 'Reset demo');
    await runFromBar(page, scenario.button);
    await shot(page, `scenario-${scenario.number}-progress`);
    for (const screen of scenario.screens) {
      await page.goto(`${BASE_URL}/${screen}`, { waitUntil: 'networkidle' });
      await shot(page, `scenario-${scenario.number}-${screen}`);
    }
    if (scenario.number === 2) await screens(browser);
    await page.goto(`${BASE_URL}/registry`, { waitUntil: 'networkidle' });
  }
  await page.context().close();
}

const mode = process.argv[2] ?? 'screens';
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
try {
  if (mode === 'all') await scenarios(browser);
  else await screens(browser);
} finally {
  await browser.close();
}
