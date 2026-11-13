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

/** The Receiving exchange sidebar, in order. */
export const EXCHANGE_NAV: NavEntry[] = [
  { label: 'Incoming payments', href: '/exchange/payments' },
  { label: 'Verify an agent', href: '/exchange/verify' },
  { label: 'Integrate', href: '/exchange/integrate' },
];

/** The primary action in the Business header. */
export const BUSINESS_ACTION: NavEntry = { label: 'Give an instruction', href: '/business/instruct' };

/** The foot of the sidebar, in both workspaces. GitHub is the third link and leaves the site. */
export const SHELL_FOOT: NavEntry[] = [
  { label: 'About Tšepo', href: '/about' },
  { label: 'FAQ', href: '/faq' },
];

export const REPOSITORY = 'https://github.com/M-Moshoeshoe/tsepo';

/** The header of the public pages: the landing page, About, FAQ and Contact. */
export const SITE_NAV: NavEntry[] = [
  { label: 'Business workspace', href: '/business' },
  { label: 'Receiving exchange', href: '/exchange/payments' },
  { label: 'Give an instruction', href: '/business/instruct' },
  { label: 'FAQ', href: '/faq' },
];

/** The footer of the public pages: the product, then the site. GitHub leaves the site and is added by the footer. */
export const SITE_FOOTER: NavEntry[] = [
  { label: 'Business workspace', href: '/business' },
  { label: 'Receiving exchange', href: '/exchange/payments' },
  { label: 'Give an instruction', href: '/business/instruct' },
  { label: 'Verify an agent', href: '/exchange/verify' },
  { label: 'Integrate', href: '/exchange/integrate' },
  { label: 'About', href: '/about' },
  { label: 'FAQ', href: '/faq' },
  { label: 'Contact', href: '/contact' },
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

/** The public pages share the site header and footer, not the product shell. */
export const PUBLIC_PAGES = new Set(['/', '/faq', '/about', '/contact']);

/**
 * The links on a page and how many clicks each takes. A sidebar or header
 * link is one click. The other workspace is two: open the switcher, choose it.
 */
export function linksFrom(route: string): { href: string; clicks: number }[] {
  if (PUBLIC_PAGES.has(route)) {
    return [...SITE_NAV, ...SITE_FOOTER, ...LANDING_ACTIONS, { label: 'Home', href: '/' }].map((entry) => ({ href: routeOf(entry.href), clicks: 1 }));
  }
  const workspace = workspaceOf(route);
  const own = workspace === 'business' ? [...BUSINESS_NAV, BUSINESS_ACTION] : EXCHANGE_NAV;
  const other: WorkspaceId = workspace === 'business' ? 'exchange' : 'business';
  return [
    ...[...own, ...SHELL_FOOT, { label: 'Logo', href: '/' }].map((entry) => ({ href: routeOf(entry.href), clicks: 1 })),
    { href: WORKSPACE_HOMES[other], clicks: 2 },
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
