'use client';

import { Home02, LinkExternal01, ShieldTick, User01 } from '@untitledui/icons';
import { usePathname } from 'next/navigation';
import { NavItemBase } from '@/components/application/app-navigation/base-components/nav-item';
import { Button } from '@/components/base/buttons/button';
import GitHub from '@/components/foundations/social-icons/github';
import { useRun } from '../run-provider.tsx';
import { Brand } from './brand.tsx';

const REPOSITORY = 'https://github.com/M-Moshoeshoe/tsepo';

const NAV = [
  { label: 'Home', href: '/', icon: Home02 },
  { label: 'Agent', href: '/agent', icon: User01 },
  { label: 'Compliance desk', href: '/compliance', icon: ShieldTick },
];

function isCurrent(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

/** The sidebar content, shared by the desktop sidebar and the phone slideout. */
export function SidebarContent({ onUnlock }: { onUnlock: () => void }) {
  const pathname = usePathname();
  const { accessCode, forgetAccessCode, busy } = useRun();
  const unlocked = accessCode !== undefined;

  return (
    <div className="flex h-full flex-col bg-secondary px-3 pt-5 pb-4">
      <div className="px-2">
        <Brand />
      </div>

      <nav aria-label="Main" className="mt-8">
        <ul className="grid gap-0.5">
          {NAV.map((item) => (
            <li key={item.href}>
              <NavItemBase type="link" href={item.href} icon={item.icon} current={isCurrent(pathname, item.href)}>
                {item.label}
              </NavItemBase>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-auto grid gap-4 border-t border-secondary px-2 pt-4 text-sm">
        <p className="flex items-center gap-2 text-tertiary">
          <span className="size-2 rounded-full bg-fg-success-secondary" aria-hidden />
          XRPL Testnet
        </p>

        <div className="grid gap-1">
          <p className="flex items-center gap-2 font-medium text-secondary">
            <span className={unlocked ? 'size-2 rounded-full bg-fg-success-secondary' : 'size-2 rounded-full bg-fg-quaternary'} aria-hidden />
            {unlocked ? 'Demo unlocked' : 'Demo locked'}
          </p>
          {unlocked ? (
            <Button color="link-gray" size="sm" onClick={forgetAccessCode} isDisabled={busy} className="justify-self-start">
              Forget the access code
            </Button>
          ) : (
            <Button color="link-color" size="sm" onClick={onUnlock} className="justify-self-start">
              Enter the access code
            </Button>
          )}
        </div>

        <a
          href={REPOSITORY}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 rounded-md text-tertiary outline-focus-ring hover:text-secondary focus-visible:outline-2"
        >
          <GitHub size={16} aria-hidden />
          Source on GitHub
          <LinkExternal01 className="size-3.5" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </div>
  );
}
