/**
 * Every link the product and the public pages show, in one place. The
 * sidebar, the header, the landing page and the FAQ render from these lists,
 * and a test walks them to prove every page is at most two clicks away.
 */
export interface NavEntry {
  label: string;
  href: string;
}

export type WorkspaceId = 'business' | 'exchange';

export const WORKSPACE_HOMES: Record<WorkspaceId, string> = {
  business: '/business',
  exchange: '/exchange/payments',
};

/** The Business sidebar, in order. */
export const BUSINESS_NAV: NavEntry[] = [
  { label: 'Overview', href: '/business' },
  { label: 'Agent', href: '/business/agent' },
  { label: 'Give an instruction', href: '/business/instruct' },
  { label: 'Payments', href: '/business/payments' },
  { label: 'Spending rules', href: '/business/rules' },
];

/** The Receiving exchange sidebar, in order. Verify an agent and Integrate join it once they are built. */
export const EXCHANGE_NAV: NavEntry[] = [{ label: 'Incoming payments', href: '/exchange/payments' }];

/** The primary action in the Business header. */
export const BUSINESS_ACTION: NavEntry = { label: 'Give an instruction', href: '/business/instruct' };

/** The foot of the sidebar, in both workspaces. GitHub is the third link and leaves the site. */
export const SHELL_FOOT: NavEntry[] = [
  { label: 'About Tšepo', href: '/' },
  { label: 'FAQ', href: '/faq' },
];

export const REPOSITORY = 'https://github.com/M-Moshoeshoe/tsepo';

/** The header of the public pages: the landing page and the FAQ. */
export const SITE_NAV: NavEntry[] = [
  { label: 'Business workspace', href: '/business' },
  { label: 'Receiving exchange', href: '/exchange/payments' },
  { label: 'Give an instruction', href: '/business/instruct' },
  { label: 'FAQ', href: '/faq' },
];

/** The landing page's calls to action, beyond its header. */
export const LANDING_ACTIONS: NavEntry[] = [
  { label: 'Take the 3-minute tour', href: '/business?tour' },
  { label: 'Open the product', href: '/business' },
];

export function workspaceOf(pathname: string): WorkspaceId {
  return pathname.startsWith('/exchange') ? 'exchange' : 'business';
}

/** The page part of an address, without the query: "/business?tour" is "/business". */
export function routeOf(href: string): string {
  return href.split('?')[0] ?? href;
}

const PUBLIC_PAGES = new Set(['/', '/faq']);

/**
 * The links on a page and how many clicks each takes. A sidebar or header
 * link is one click. Every page of the other workspace is two: the switcher
 * lists each workspace's pages, so it is open the switcher, then choose.
 */
export function linksFrom(route: string): { href: string; clicks: number }[] {
  if (PUBLIC_PAGES.has(route)) return [...SITE_NAV, ...LANDING_ACTIONS, { label: 'Home', href: '/' }].map((entry) => ({ href: routeOf(entry.href), clicks: 1 }));
  const workspace = workspaceOf(route);
  const own = workspace === 'business' ? [...BUSINESS_NAV, BUSINESS_ACTION] : EXCHANGE_NAV;
  const other = workspace === 'business' ? EXCHANGE_NAV : BUSINESS_NAV;
  return [
    ...[...own, ...SHELL_FOOT, { label: 'Logo', href: WORKSPACE_HOMES[workspace] }].map((entry) => ({ href: routeOf(entry.href), clicks: 1 })),
    ...other.map((entry) => ({ href: routeOf(entry.href), clicks: 2 })),
  ];
}

/** The fewest clicks from `start` to every page that can be reached, by shortest path. */
export function clicksFrom(start: string): Map<string, number> {
  const best = new Map<string, number>([[start, 0]]);
  const queue = [start];
  while (queue.length > 0) {
    queue.sort((a, b) => (best.get(a) ?? 0) - (best.get(b) ?? 0));
    const route = queue.shift();
    if (route === undefined) break;
    const here = best.get(route) ?? 0;
    for (const link of linksFrom(route)) {
      const cost = here + link.clicks;
      if (cost < (best.get(link.href) ?? Infinity)) {
        best.set(link.href, cost);
        queue.push(link.href);
      }
    }
  }
  return best;
}
