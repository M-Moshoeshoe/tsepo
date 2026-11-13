import type { ReactNode } from 'react';
import { SiteFooter, SiteHeader } from './site-chrome.tsx';
import { SITE_WIDTH } from './site-chrome.tsx';

/**
 * A public page built from the landing page's own parts: the same header,
 * the same opening type scale and spacing as the hero, then landing-page
 * sections (see Section) and the footer.
 */
export function LandingStylePage({ title, lead, children }: { title: string; lead: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-primary">
      <SiteHeader />
      <main id="main">
        <div className={`${SITE_WIDTH} grid gap-5 pt-12 pb-2 md:pt-16`}>
          <h1 className="max-w-3xl text-display-md font-medium text-primary md:text-display-lg">{title}</h1>
          <div className="max-w-2xl text-lg text-tertiary md:text-xl">{lead}</div>
        </div>
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
