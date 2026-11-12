import { Building07, CoinsHand, Home02, Receipt, Sliders01, User01 } from '@untitledui/icons';
import type { FC } from 'react';

export type WorkspaceId = 'business' | 'exchange';

export interface NavLink {
  label: string;
  href: string;
  icon: FC<{ className?: string }>;
}

export interface Workspace {
  id: WorkspaceId;
  /** The sample organisation that owns the workspace. */
  name: string;
  /** What kind of workspace it is, shown under the name. */
  type: string;
  /** One line on who the workspace is for, shown in the switcher. */
  forWhom: string;
  home: string;
  nav: NavLink[];
}

/** The two workspaces. Both organisations are fictional sample data. */
export const WORKSPACES: Record<WorkspaceId, Workspace> = {
  business: {
    id: 'business',
    name: 'Lesedi Design Studio',
    type: 'Business',
    forWhom: 'For the finance lead who runs the agent',
    home: '/business',
    nav: [
      { label: 'Overview', href: '/business', icon: Home02 },
      { label: 'Agent', href: '/business/agent', icon: User01 },
      { label: 'Payments', href: '/business/payments', icon: Receipt },
      { label: 'Spending rules', href: '/business/rules', icon: Sliders01 },
    ],
  },
  exchange: {
    id: 'exchange',
    name: 'Sample Exchange',
    type: 'Exchange',
    forWhom: 'For the compliance officer who receives agent payments',
    home: '/exchange/payments',
    nav: [{ label: 'Incoming payments', href: '/exchange/payments', icon: CoinsHand }],
  },
};

export const WORKSPACE_ICONS: Record<WorkspaceId, FC<{ className?: string }>> = {
  business: Building07,
  exchange: CoinsHand,
};

export function workspaceFor(pathname: string): Workspace {
  return pathname.startsWith('/exchange') ? WORKSPACES.exchange : WORKSPACES.business;
}

/** The current nav link: the longest href that the address starts with. */
export function currentLink(pathname: string): NavLink | undefined {
  return workspaceFor(pathname)
    .nav.filter((link) => pathname === link.href || pathname.startsWith(`${link.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}
