'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Logo } from './display.tsx';
import { cn } from './ui/cn.ts';

const LINKS = [
  { href: '/registry', label: 'Agent registry', note: 'Business console' },
  { href: '/compliance', label: 'Compliance desk', note: 'Demo Exchange' },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[1232px] flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3">
        <Link href="/registry" className="flex items-center gap-2 rounded-md text-base font-semibold text-ink">
          <Logo />
          Tšepo
        </Link>
        <nav aria-label="Main" className="flex gap-1">
          {LINKS.map((link) => {
            const current = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium',
                  current ? 'bg-background text-primary' : 'text-muted hover:text-ink',
                )}
              >
                {link.label}
                <span className="sr-only">, {link.note}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
