'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './display.tsx';
import { useRun } from './run-provider.tsx';
import { Badge } from './ui/badge.tsx';
import { cn } from './ui/cn.ts';

const LINKS = [
  { href: '/', label: 'Overview' },
  { href: '/registry', label: 'Agent registry' },
  { href: '/compliance', label: 'Compliance desk' },
];

function isCurrent(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}

/** The header on every page. Below the small breakpoint the navigation becomes a compact tab bar. */
export function SiteHeader() {
  const pathname = usePathname();
  const { accessCode } = useRun();
  const unlocked = accessCode !== undefined;

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[1232px] items-center gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 rounded-md text-base font-semibold text-ink">
          <Logo />
          Tšepo
        </Link>
        <nav aria-label="Main" className="hidden sm:block">
          <ul className="flex gap-1">
            {LINKS.map((link) => {
              const current = isCurrent(pathname, link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={current ? 'page' : undefined}
                    className={cn(
                      'rounded-md px-3 py-1.5 text-sm font-medium',
                      current ? 'bg-background text-primary' : 'text-muted hover:text-ink',
                    )}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <Badge>XRPL Testnet</Badge>
          <Badge tone={unlocked ? 'cleared' : 'neutral'}>{unlocked ? 'Demo unlocked' : 'Demo locked'}</Badge>
        </div>
      </div>
      <nav aria-label="Main" className="border-t border-border sm:hidden">
        <ul className="grid grid-cols-3">
          {LINKS.map((link) => {
            const current = isCurrent(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={current ? 'page' : undefined}
                  className={cn(
                    'flex h-11 items-center justify-center border-b-2 px-1 text-center text-[13px] font-medium',
                    current ? 'border-primary text-primary' : 'border-transparent text-muted',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
