import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { after, before, describe, it } from 'node:test';
import type { Browser, Page } from 'playwright';
import type { DemoEvent } from '../../src/demo/events.ts';
import { DESK_FILTERS, emptyDeskText } from '../../src/views/desk.ts';
import {
  BASE_URL,
  PAGE_ERROR_TEXT,
  accessCode,
  axeViolations,
  lastEvent,
  openBrowser,
  openPage,
  runThroughApi,
  startServer,
  stopServer,
} from './helpers.ts';

/**
 * End-to-end checks for Batch 1, against a running production build and the
 * XRP Ledger Testnet. Start the app first (npm run build && npm start), then
 * run npm run test:e2e. About nine runs and five Claude calls.
 */

const RUN_TIMEOUT = 240_000;
let browser: Browser;
let page: Page;

function stepTexts(events: DemoEvent[]): string[] {
  return events.filter((event) => event.type === 'step').map((event) => event.text);
}

function assertFinished(events: DemoEvent[], label: string): void {
  const last = lastEvent(events);
  assert.equal(last?.type, 'done', `${label} did not finish: ${last?.text ?? 'no events'}`);
}

before(async () => {
  browser = await openBrowser();
  page = await openPage(browser, 1280);
});

after(async () => {
  await browser.close();
});

void describe('access code', () => {
  void it('refuses a wrong code with a clear message and does not save it', async () => {
    await page.getByRole('button', { name: 'Run scenario', exact: true }).click();
    const dialog = page.getByRole('dialog', { name: 'Enter the demo access code' });
    await dialog.locator('input[type="password"]').fill('wrong-code-123');
    await dialog.getByRole('button', { name: 'Unlock the demo' }).click();
    await dialog.getByText('That access code was not accepted. Check it and try again.').waitFor();
    assert.equal(await page.getByText('Demo locked').isVisible(), true);

    await dialog.locator('input[type="password"]').fill(accessCode());
    await dialog.getByRole('button', { name: 'Unlock the demo' }).click();
    await dialog.waitFor({ state: 'detached' });
    assert.equal(await page.getByText('Demo unlocked').isVisible(), true);
  });
});

void describe('empty states', () => {
  void it('show a plain message, not an error, on every desk tab after a reset', { timeout: RUN_TIMEOUT }, async () => {
    assertFinished(await runThroughApi({ kind: 'reset' }), 'Reset');
    const desk = await openPage(browser, 1280);
    for (const filter of DESK_FILTERS) {
      await desk.goto(`${BASE_URL}/compliance${filter.id === 'all' ? '' : `?filter=${filter.id}`}`, { waitUntil: 'networkidle' });
      const text = await desk.locator('#main').innerText();
      assert.equal(text.includes(PAGE_ERROR_TEXT), false, `the ${filter.label} tab crashed`);
      assert.equal(text.includes(emptyDeskText(filter.id).title), true, `the ${filter.label} tab has no empty message`);
    }
    await desk.context().close();
  });

  void it('show a plain message on every page of a fresh install with no records', { timeout: RUN_TIMEOUT }, async () => {
    const folder = await mkdtemp(join(tmpdir(), 'tsepo-fresh-'));
    const server = await startServer(3101, { TSEPO_DATA_DIR: folder });
    try {
      const fresh = await openPage(browser, 1280, 'http://localhost:3101');
      const expected: [string, string][] = [
        ['/', 'No activity yet.'],
        ['/agent', 'No payments yet.'],
        ['/compliance', 'No payments yet.'],
      ];
      for (const [path, message] of expected) {
        await fresh.goto(`http://localhost:3101${path}`, { waitUntil: 'networkidle' });
        const text = await fresh.locator('#main').innerText();
        assert.equal(text.includes(PAGE_ERROR_TEXT), false, `${path} crashed on a fresh install`);
        assert.equal(text.includes(message), true, `${path} has no empty message on a fresh install`);
      }
      await fresh.context().close();
    } finally {
      stopServer(server);
      await rm(folder, { recursive: true, force: true });
    }
  });
});

void describe('scenarios in any order', () => {
  void it('runs 2, then 3, then 4, then 2 with no reset in between', { timeout: RUN_TIMEOUT * 4 }, async () => {
    for (const kind of ['scenario-2', 'scenario-3', 'scenario-4', 'scenario-2'] as const) {
      const events = await runThroughApi({ kind });
      assertFinished(events, kind);
      assert.equal(stepTexts(events)[0], 'Preparing the demo', `${kind} did not prepare the demo first`);
    }
  });

  void it('says "1 payment", not "payment(s)"', { timeout: RUN_TIMEOUT }, async () => {
    const events = await runThroughApi({ kind: 'scenario-2' });
    assertFinished(events, 'scenario-2');
    assert.ok(events.some((event) => event.text === 'Claude read 1 payment from the instruction'));
    assert.ok(events.every((event) => !event.text.includes('payment(s)')));
  });

  void it('lists each transaction once in scenario 1', { timeout: RUN_TIMEOUT }, async () => {
    const events = await runThroughApi({ kind: 'scenario-1' });
    assertFinished(events, 'scenario-1');
    const hashes = events.flatMap((event) => (event.type === 'line' && event.hash !== undefined ? [event.hash] : []));
    assert.equal(new Set(hashes).size, hashes.length);
  });
});

void describe('change limits', () => {
  void it('applies new limits through the real run path, and the next scenario restores the demo limits', { timeout: RUN_TIMEOUT * 2 }, async () => {
    const changed = await runThroughApi({ kind: 'change-limits', perPaymentLimit: '3', dailyLimit: '6' });
    assertFinished(changed, 'Change limits');
    assert.equal(lastEvent(changed)?.text, 'Limits changed to 3 RLUSD per payment and 6 RLUSD per day. The credential now proves the new mandate.');

    const agent = await openPage(browser, 1280, BASE_URL, '/agent');
    assert.ok((await agent.locator('section[aria-labelledby="mandate-title"]').innerText()).includes('Daily limit: 6 RLUSD'));
    await agent.context().close();

    const split = await runThroughApi({ kind: 'scenario-3' });
    assertFinished(split, 'scenario-3 after changed limits');
    assert.ok(split.some((event) => event.text.startsWith('The business restores the demo limits')));
  });
});

void describe('the interface', () => {
  void it('announces a finished run to screen readers', { timeout: RUN_TIMEOUT }, async () => {
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: 'Run Scenario 1: Unknown agent' }).click();
    await page.getByRole('status').filter({ hasText: 'Scenario 1: Unknown agent finished.' }).waitFor({ timeout: RUN_TIMEOUT });
  });

  void it('lets Tab reach every Run button in the runbook', async () => {
    const home = await openPage(browser, 1280);
    const reached = new Set<string>();
    for (let stop = 0; stop < 60; stop += 1) {
      await home.keyboard.press('Tab');
      const label = await home.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? '');
      if (label.startsWith('Run Scenario')) reached.add(label);
    }
    assert.deepEqual([...reached].sort(), [
      'Run Scenario 1: Unknown agent',
      'Run Scenario 2: Verified agent',
      'Run Scenario 3: Split payments',
      'Run Scenario 4: Revoke',
    ]);
    await home.context().close();
  });

  void it('makes the desk filters links in a nav, with aria-current on the chosen one', async () => {
    const desk = await openPage(browser, 1280, BASE_URL, '/compliance?filter=refused');
    const current = desk.getByRole('navigation', { name: 'Filter payments' }).locator('a[aria-current="page"]');
    assert.equal(await current.count(), 1);
    assert.ok((await current.innerText()).startsWith('Refused'));
    await desk.context().close();
  });

  void it('says who decided each payment, and labels refused attempts', async () => {
    const desk = await openPage(browser, 1280, BASE_URL, '/compliance');
    const table = await desk.getByRole('grid').innerText();
    assert.ok(table.includes("Reported by the agent's policy service"));
    assert.ok(table.includes('The exchange'));
    await desk.getByRole('row').filter({ hasText: 'Cleared' }).first().click();
    const details = desk.getByRole('dialog', { name: 'Payment details' });
    await details.getByText("It needed the policy service's signature, and the exchange accepted it.").waitFor();
    await desk.context().close();
  });

  void it('has no critical or serious axe violations and one banner, on every page at both widths', { timeout: RUN_TIMEOUT }, async () => {
    for (const width of [1280, 390]) {
      for (const path of ['/', '/agent', '/compliance', '/compliance?filter=held']) {
        const view = await openPage(browser, width, BASE_URL, path);
        const violations = await axeViolations(view);
        const serious = violations.filter((violation) => violation.startsWith('critical') || violation.startsWith('serious'));
        assert.deepEqual(serious, [], `${path} at ${String(width)}px`);
        const landmarks = violations.filter((violation) => /landmark-no-duplicate-(banner|main)|landmark-main-is-top-level/.test(violation));
        assert.deepEqual(landmarks, [], `${path} at ${String(width)}px`);
        await view.context().close();
      }
    }
  });

  void it('serves a favicon from the Tšepo mark', async () => {
    const icon = await fetch(`${BASE_URL}/icon.svg`);
    assert.equal(icon.status, 200);
    assert.ok((await icon.text()).includes('#C7841A'));
    const html = await (await fetch(`${BASE_URL}/compliance`)).text();
    assert.ok(/<link rel="icon" href="\/icon\.svg/.test(html));
  });
});
