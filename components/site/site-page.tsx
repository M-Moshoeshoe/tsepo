import type { ReactNode } from 'react';
import { SITE_WIDTH, SiteFooter, SiteHeader } from './site-chrome.tsx';

/**
 * A supporting public page in the landing page's system: the header, a
 * medium-weight title with its lead sentence beside it, the content, and the
 * footer.
 */
export function SitePage({ title, lead, children }: { title: string; lead: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-primary">
      <SiteHeader />
      <main id="main">
        <div className={`${SITE_WIDTH} grid gap-4 pt-12 pb-10 md:pt-20 md:pb-14 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-16`}>
          <h1 className="text-display-sm font-medium text-primary md:text-display-lg">{title}</h1>
          <div className="text-lg text-tertiary">{lead}</div>
        </div>
        <div className={`${SITE_WIDTH} pb-20 md:pb-24`}>{children}</div>
      </main>
      <SiteFooter />
    </div>
  );
}

/** One titled part of a supporting page: a hairline rule, the title on the left on wide screens, the text on the right. */
export function PagePart({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-4 border-t border-secondary py-10 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
      <h2 className="text-xl font-medium text-primary">{title}</h2>
      <div className="grid max-w-2xl gap-4 text-lg text-tertiary">{children}</div>
    </section>
  );
}

/** A text link inside running text. */
export const INLINE_LINK = 'font-semibold text-brand-secondary underline-offset-4 hover:text-brand-secondary_hover hover:underline';
