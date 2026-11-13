import type { Metadata } from 'next';
import { SiteButton } from '../components/site/site-button.tsx';
import { Brand } from '../components/shell/brand.tsx';

export const metadata: Metadata = { title: 'Page not found - Tšepo' };

/** Any address that does not exist. It says so plainly and offers the three places to go. */
export default function NotFound() {
  return (
    <main id="main" className="mx-auto grid min-h-dvh max-w-xl content-center gap-6 px-4 py-16">
      <Brand href="/" />
      <div className="grid gap-2">
        <h1 className="text-display-xs font-semibold text-primary">This page does not exist</h1>
        <p className="text-md text-tertiary">The address may be mistyped, or the page may have moved.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <SiteButton href="/about" variant="primary" size="md">
          About Tšepo
        </SiteButton>
        <SiteButton href="/business" variant="secondary" size="md">
          Business workspace
        </SiteButton>
        <SiteButton href="/exchange/payments" variant="secondary" size="md">
          Platform workspace
        </SiteButton>
      </div>
    </main>
  );
}
