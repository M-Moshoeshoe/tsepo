import Link from 'next/link';
import { REPOSITORY, SITE_FOOTER, SITE_NAV } from '../../src/views/navigation.ts';
import { Brand } from '../shell/brand.tsx';

const NAV_LINK = 'rounded-sm text-sm font-semibold text-secondary outline-focus-ring hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2';
const FOOT_LINK = 'rounded-sm text-sm text-tertiary outline-focus-ring hover:text-primary focus-visible:outline-2';

/** The header of the public pages, with the logo and the main destinations. */
export function SiteHeader() {
  return (
    <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-6 lg:px-8">
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

/** The footer of the public pages: every destination, the source, and what is real here. */
export function SiteFooter() {
  const product = SITE_FOOTER.slice(0, 5);
  const site = SITE_FOOTER.slice(5);
  return (
    <footer className="border-t border-secondary bg-secondary">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-10 pb-10 sm:grid-cols-[2fr_1fr_1fr] lg:px-8">
        <div className="grid content-start gap-3">
          <Brand href="/" />
          <p className="max-w-sm text-sm text-tertiary">Identity and spending rules for AI agents that pay, on the XRP Ledger.</p>
        </div>
        <nav aria-label="Product" className="grid content-start gap-2">
          <p className="text-sm font-semibold text-primary">Product</p>
          {product.map((entry) => (
            <Link key={entry.href} href={entry.href} className={FOOT_LINK}>
              {entry.label}
            </Link>
          ))}
        </nav>
        <nav aria-label="Tšepo" className="grid content-start gap-2">
          <p className="text-sm font-semibold text-primary">Tšepo</p>
          {site.map((entry) => (
            <Link key={entry.href} href={entry.href} className={FOOT_LINK}>
              {entry.label}
            </Link>
          ))}
          <a href={REPOSITORY} target="_blank" rel="noreferrer" className={FOOT_LINK}>
            GitHub<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </nav>
      </div>
      <p className="mx-auto max-w-6xl border-t border-secondary px-4 py-5 text-sm text-tertiary lg:px-8">
        Testnet. Sample businesses and people. No real money moves.
      </p>
    </footer>
  );
}
