import Link from 'next/link';
import { REPOSITORY, SITE_NAV } from '../../src/views/navigation.ts';
import { Brand, BrandMark } from '../shell/brand.tsx';

const NAV_LINK = 'rounded-sm text-sm font-semibold text-secondary outline-focus-ring hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2';

/** The header of the public pages, with the logo and every main destination. */
export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-6 lg:px-8">
      <Brand href="/" />
      <nav aria-label="Main">
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {SITE_NAV.map((entry) => (
            <li key={entry.href}>
              <Link href={entry.href} className={NAV_LINK}>
                {entry.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

/** The footer of the public pages: what is real, the source, and credits for borrowed work. */
export function SiteFooter() {
  return (
    <footer className="mx-auto grid max-w-5xl gap-2 border-t border-secondary px-4 pt-6 pb-10 text-sm text-tertiary lg:px-8">
      <p className="flex items-center gap-2 font-medium text-secondary">
        <BrandMark className="size-5" />
        Testnet. Sample businesses and people. Tšepo was built for the Node Engine Hackathon 2026.
      </p>
      <p>
        <Link href="/faq" className="font-semibold text-brand-secondary hover:text-brand-secondary_hover">
          FAQ
        </Link>
        {' · '}
        <a href={REPOSITORY} target="_blank" rel="noreferrer" className="font-semibold text-brand-secondary hover:text-brand-secondary_hover">
          Source on GitHub<span className="sr-only"> (opens in a new tab)</span>
        </a>
      </p>
      <p className="text-xs">
        Credits: interface components from Untitled UI React (MIT licence) on React Aria (Apache 2.0 licence), Untitled UI icons
        (MIT licence), and the IBM Plex typefaces (SIL Open Font Licence).
      </p>
    </footer>
  );
}
