import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { Browser, Page } from 'playwright';
import { axeViolations, openBrowser, openPage } from './helpers.ts';

/**
 * The public pages, read in a real browser against a running production
 * build. Nothing here runs a payment or calls Claude, so it is cheap to run
 * on every change to the public pages: npm run test:site.
 */
const PAGES = ['/', '/explore', '/about', '/faq', '/contact', '/exchange/integrate'];
const WIDTHS = [1280, 390];
const TIMEOUT = 120_000;

/**
 * Text that is cut off or spills out: an ellipsis, a line clamp, or content
 * larger than a box that hides its overflow. Screen-reader-only text, which
 * is clipped on purpose, and scrollable regions such as code are left out.
 */
async function clippedText(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const found: string[] = [];
    for (const element of document.querySelectorAll('body *')) {
      if (!(element instanceof HTMLElement)) continue; // SVG has no text to cut
      const style = getComputedStyle(element);
      const text = element.innerText.trim();
      if (text === '' || style.display === 'none' || style.visibility === 'hidden') continue;
      // Screen-reader-only text is clipped to nothing on purpose.
      if (style.clipPath === 'inset(50%)') continue;
      if (element.closest('[class~="sr-only"]') !== null) continue;
      const clamped = style.webkitLineClamp !== 'none' && style.webkitLineClamp !== '';
      const ellipsis = style.textOverflow === 'ellipsis' && element.scrollWidth > element.clientWidth + 1;
      const hides = ['hidden', 'clip'].includes(style.overflowX) || ['hidden', 'clip'].includes(style.overflowY);
      const spills = hides && (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1);
      // A rounded card may hide overflow only to clip its corners; it counts only when its own text is cut.
      const ownText = [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '');
      if (clamped || ellipsis || (spills && ownText)) found.push(`${element.tagName.toLowerCase()}: "${text.slice(0, 60)}"`);
    }
    return found;
  });
}

let browser: Browser;

void describe('the public pages', () => {
  before(async () => {
    browser = await openBrowser();
  });
  after(async () => {
    await browser.close();
  });

  for (const width of WIDTHS) {
    for (const path of PAGES) {
      void it(`${path} at ${String(width)}px: no clipped text, no sideways scroll, no serious axe finding`, { timeout: TIMEOUT }, async () => {
        const page = await openPage(browser, width, undefined, path);
        const sideways = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert.ok(sideways <= 0, `the page scrolls sideways by ${String(sideways)}px`);
        assert.deepEqual(await clippedText(page), []);
        const serious = (await axeViolations(page)).filter((violation) => violation.startsWith('critical') || violation.startsWith('serious'));
        assert.deepEqual(serious, []);
        await page.context().close();
      });
    }
  }

  void it('opens the product through the chooser, with no sign-up', { timeout: TIMEOUT }, async () => {
    const page = await openPage(browser, 1280);
    await page.getByRole('main').getByRole('link', { name: 'Open the product' }).first().click();
    await page.waitForURL(/\/explore$/);
    assert.ok(await page.getByText('No sign-up is needed.').isVisible());
    await page.getByRole('link', { name: /Explore as the Receiving exchange/ }).click();
    await page.waitForURL(/\/exchange\/payments/);
    await page.context().close();
  });

  void it('links every header section to a section that exists on the landing page', { timeout: TIMEOUT }, async () => {
    const page = await openPage(browser, 1280);
    for (const id of ['how-it-works', 'for-businesses', 'for-exchanges']) assert.equal(await page.locator(`#${id}`).count(), 1, id);
    await page.context().close();
  });
});
