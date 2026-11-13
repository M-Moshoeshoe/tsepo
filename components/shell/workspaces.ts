import { Building07, CheckVerified01, CodeBrowser, CoinsHand, Home02, MessageChatSquare, Receipt, Sliders01, User01 } from '@untitledui/icons';
import type { FC } from 'react';
import { BUSINESS_NAV, EXCHANGE_NAV, WORKSPACE_HOMES, workspaceOf, type NavEntry, type WorkspaceId } from '../../src/views/navigation.ts';

export type { WorkspaceId } from '../../src/views/navigation.ts';

export interface NavLink extends NavEntry {
  icon: FC<{ className?: string }>;
}

export interface Workspace {
  id: WorkspaceId;
  /** The organisation that owns the workspace. */
  name: string;
  /** What kind of workspace it is, shown under the name. */
  type: string;
  /** One line on who the workspace is for, shown in the switcher. */
  forWhom: string;
  home: string;
  nav: NavLink[];
}

const ICONS: Record<string, FC<{ className?: string }>> = {
  '/business': Home02,
  '/business/agent': User01,
  '/business/instruct': MessageChatSquare,
  '/business/payments': Receipt,
  '/business/rules': Sliders01,
  '/exchange/payments': CoinsHand,
  '/exchange/verify': CheckVerified01,
  '/exchange/integrate': CodeBrowser,
};

const withIcons = (entries: NavEntry[]): NavLink[] => entries.map((entry) => ({ ...entry, icon: ICONS[entry.href] ?? Home02 }));

/** The two workspaces. Both organisations and the people in them are fictional. */
export const WORKSPACES: Record<WorkspaceId, Workspace> = {
  business: {
    id: 'business',
    name: 'Lesedi Design Studio',
    type: 'Business',
    forWhom: 'The business that runs the agent and sets its spending rules.',
    home: WORKSPACE_HOMES.business,
    nav: withIcons(BUSINESS_NAV),
  },
  exchange: {
    id: 'exchange',
    name: 'Receiving exchange',
    type: 'Exchange',
    forWhom: 'The exchange where Naledi and other recipients hold their accounts. It accepts agent payments only from verified agents.',
    home: WORKSPACE_HOMES.exchange,
    nav: withIcons(EXCHANGE_NAV),
  },
};

export const WORKSPACE_ICONS: Record<WorkspaceId, FC<{ className?: string }>> = {
  business: Building07,
  exchange: CoinsHand,
};

export function workspaceFor(pathname: string): Workspace {
  return WORKSPACES[workspaceOf(pathname)];
}

/** The current nav link: the longest href that the address starts with. */
export function currentLink(pathname: string): NavLink | undefined {
  return workspaceFor(pathname)
    .nav.filter((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
