import Link from 'next/link';
import { LANDING_ACTIONS, REPOSITORY, SITE_FOOTER_COMPANY, SITE_FOOTER_PRODUCT, SITE_NAV, type NavEntry } from '../../src/views/navigation.ts';
import { Brand } from '../shell/brand.tsx';
import { SiteButton } from './site-button.tsx';

/** The width every public section shares: 1200px of content, with a 16px gutter on a phone. */
export const SITE_WIDTH = 'mx-auto w-full max-w-[1264px] px-4 md:px-8';

const NAV_LINK = 'rounded-sm text-sm font-medium text-secondary outline-focus-ring hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2';
const FOOT_LINK = 'rounded-sm text-sm text-tertiary outline-focus-ring hover:text-primary focus-visible:outline-2';

const [tour, product] = LANDING_ACTIONS;

/** The header of the public pages: the logo, the landing page sections, the FAQ, and the two ways in. */
export function SiteHeader() {
  return (
    <header className="border-b border-secondary bg-primary">
      <div className={`${SITE_WIDTH} flex flex-wrap items-center gap-x-10 gap-y-3 py-3.5`}>
        <Brand href="/" />
        <nav aria-label="Main" className="order-last w-full md:order-none md:w-auto md:flex-1">
          <ul className="flex flex-wrap gap-x-5 gap-y-1 md:gap-x-7">
            {SITE_NAV.map((entry) => (
              <li key={entry.label}>
                <Link href={entry.href} className={NAV_LINK}>
                  {entry.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {product !== undefined && (
            <span className="max-sm:hidden">
              <SiteButton href={product.href} variant="secondary" size="sm">
                {product.label}
              </SiteButton>
            </span>
          )}
          {tour !== undefined && (
            <SiteButton href={tour.href} variant="primary" size="sm">
              {tour.label}
            </SiteButton>
          )}
        </div>
      </div>
    </header>
  );
}

function FooterGroup({ label, entries, external }: { label: string; entries: NavEntry[]; external?: NavEntry }) {
  return (
    <nav aria-label={label} className="grid content-start gap-3">
      <p className="text-sm font-semibold text-primary">{label}</p>
      <ul className="grid gap-2">
        {entries.map((entry) => (
          <li key={entry.href}>
            <Link href={entry.href} className={FOOT_LINK}>
              {entry.label}
            </Link>
          </li>
        ))}
        {external !== undefined && (
          <li>
            <a href={external.href} target="_blank" rel="noreferrer" className={FOOT_LINK}>
              {external.label}
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </li>
        )}
      </ul>
    </nav>
  );
}

/** The footer of the public pages: the product, the company pages, the source, and the Testnet line. */
export function SiteFooter() {
  return (
    <footer className="border-t border-secondary bg-primary">
      <div className={`${SITE_WIDTH} grid gap-10 py-12 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr]`}>
        <div className="grid content-start gap-3 sm:col-span-2 md:col-span-1">
          <Brand href="/" />
          <p className="max-w-xs text-sm text-tertiary">Tšepo gives AI agents that pay a verified identity and spending rules they cannot break.</p>
        </div>
        <FooterGroup label="Product" entries={SITE_FOOTER_PRODUCT} />
        <FooterGroup label="Company" entries={SITE_FOOTER_COMPANY} external={{ label: 'GitHub', href: REPOSITORY }} />
      </div>
      <div className="border-t border-secondary">
        <p className={`${SITE_WIDTH} py-5 text-sm text-tertiary`}>
          Tšepo runs on the XRP Ledger Testnet. The businesses and people are samples, and no real money moves.
        </p>
      </div>
    </footer>
  );
}
