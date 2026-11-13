import { describe, expect, it } from 'vitest';
import { pageRoutes } from '../../test/routes.ts';
import { clicksFrom, EXPLORE_AS, LANDING_ACTIONS, linksFrom, PUBLIC_PAGES, routeOf, SITE_NAV, workspaceOf } from './navigation.ts';

const ROUTES = pageRoutes();

describe('navigation', () => {
  it('finds the pages from the app folder', () => {
    expect(ROUTES).toEqual(expect.arrayContaining(['/', '/faq', '/about', '/contact', '/business', '/business/instruct', '/exchange/payments', '/exchange/verify', '/exchange/integrate']));
  });

  it('reaches every page within two clicks from the landing page', () => {
    const reach = clicksFrom('/');
    const far = ROUTES.filter((route) => (reach.get(route) ?? Infinity) > 2);
    expect(far, `more than two clicks from the landing page: ${far.join(', ')}`).toEqual([]);
  });

  it('reaches every page of its own workspace within two clicks, from any page of that workspace', () => {
    for (const start of ROUTES.filter((route) => !PUBLIC_PAGES.has(route))) {
      const reach = clicksFrom(start);
      const own = ROUTES.filter((route) => !PUBLIC_PAGES.has(route) && workspaceOf(route) === workspaceOf(start));
      const far = own.filter((route) => (reach.get(route) ?? Infinity) > 2);
      expect(far, `more than two clicks from ${start}: ${far.join(', ')}`).toEqual([]);
    }
  });

  it('opens the product through a chooser of who to explore as, one click from the landing page', () => {
    expect(LANDING_ACTIONS.find((action) => action.label === 'Open the product')?.href).toBe('/explore');
    expect(EXPLORE_AS.map((choice) => choice.href)).toEqual(['/business', '/exchange/payments']);
    expect(clicksFrom('/').get('/explore')).toBe(1);
  });

  it('treats a landing page section as the landing page itself', () => {
    expect(routeOf('/#how-it-works')).toBe('/');
    expect(SITE_NAV.filter((entry) => entry.href.startsWith('/#')).map((entry) => entry.href)).toEqual(['/#how-it-works', '/#for-businesses', '/#for-exchanges']);
  });

  it('links only to pages that exist', () => {
    const known = new Set(ROUTES);
    for (const route of ROUTES) {
      for (const link of linksFrom(route)) expect(known.has(link.href), `${route} links to ${link.href}`).toBe(true);
    }
  });
});
