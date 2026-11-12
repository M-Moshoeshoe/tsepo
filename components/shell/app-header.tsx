'use client';

import { Compass03 } from '@untitledui/icons';
import { usePathname } from 'next/navigation';
import { BadgeWithDot } from '@/components/base/badges/badges';
import { Button } from '@/components/base/buttons/button';
import { Term } from '../term.tsx';
import { useTour } from '../tour/tour-provider.tsx';
import { currentLink } from './workspaces.ts';

/**
 * Like a test mode badge: always visible, never alarming. An Untitled UI brand
 * badge, because the theme keeps the accent colour for the marks. Opens a
 * one-line explanation.
 */
function TestnetBadge() {
  return (
    <Term term="testnet" className="cursor-help rounded-full outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2">
      <BadgeWithDot type="pill-color" color="brand" size="md">
        Testnet
      </BadgeWithDot>
    </Term>
  );
}

/** The page title, the Testnet badge and the guided tour button. */
export function AppHeader() {
  const pathname = usePathname();
  const { open, toggle } = useTour();
  const title = currentLink(pathname)?.label ?? 'Tšepo';

  return (
    <header className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 pt-6 pb-5 lg:px-8 lg:pt-8">
      <h1 className="text-display-xs font-semibold text-primary">{title}</h1>
      <TestnetBadge />
      <div className="ml-auto">
        <Button color={open ? 'secondary' : 'primary'} size="md" iconLeading={Compass03} onClick={toggle} aria-expanded={open} aria-controls="guided-tour">
          Guided tour
        </Button>
      </div>
    </header>
  );
}
