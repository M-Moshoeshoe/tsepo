'use client';

import { HelpCircle, InfoCircle, LinkExternal01 } from '@untitledui/icons';
import type { FC } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavItemBase } from '@/components/application/app-navigation/base-components/nav-item';
import GitHub from '@/components/foundations/social-icons/github';
import { Brand } from './brand.tsx';
import { WorkspaceSwitcher } from './workspace-switcher.tsx';
import { REPOSITORY, SHELL_FOOT } from '../../src/views/navigation.ts';
import { currentLink, workspaceFor } from './workspaces.ts';

const FOOT_ICONS: Record<string, FC<{ className?: string }>> = { '/': InfoCircle, '/faq': HelpCircle };

const FOOT_LINK =
  'flex items-center gap-2 rounded-md text-tertiary outline-focus-ring hover:text-secondary focus-visible:outline-2';

/** The logo, linking to the current workspace's overview. */
export function WorkspaceBrand() {
  return <Brand href={workspaceFor(usePathname()).home} />;
}

/** The sidebar content, shared by the desktop sidebar and the phone slideout. */
export function SidebarContent() {
  const pathname = usePathname();
  const workspace = workspaceFor(pathname);
  const current = currentLink(pathname);

  return (
    <div className="flex h-full flex-col bg-secondary px-3 pt-5 pb-4">
      <div className="px-2">
        <Brand href={workspace.home} />
      </div>

      <div className="mt-8">
        <WorkspaceSwitcher />
      </div>

      <nav aria-label={`${workspace.type} workspace`} className="mt-6">
        <ul className="grid gap-0.5">
          {workspace.nav.map((item) => (
            <li key={item.href}>
              <NavItemBase type="link" href={item.href} icon={item.icon} current={current?.href === item.href}>
                {item.label}
              </NavItemBase>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto grid gap-3 border-t border-secondary px-2 pt-4 text-sm">
        {SHELL_FOOT.map((entry) => {
          const Icon = FOOT_ICONS[entry.href] ?? InfoCircle;
          return (
            <Link key={entry.href} href={entry.href} className={FOOT_LINK}>
              <Icon className="size-4" aria-hidden />
              {entry.label}
            </Link>
          );
        })}
        <a href={REPOSITORY} target="_blank" rel="noreferrer" className={FOOT_LINK}>
          <GitHub size={16} aria-hidden />
          GitHub
          <LinkExternal01 className="size-3.5" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </div>
  );
}
