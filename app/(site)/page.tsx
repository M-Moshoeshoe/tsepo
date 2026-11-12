import type { Metadata } from 'next';
import { Button } from '@/components/base/buttons/button';
import { JoinPilot } from '../../components/site/join-pilot.tsx';
import { SiteFooter, SiteHeader } from '../../components/site/site-chrome.tsx';
import { LANDING_ACTIONS } from '../../src/views/navigation.ts';

export const metadata: Metadata = {
  title: 'Tšepo: spending rules your AI agent cannot break',
  description:
    'Tšepo gives a business’s AI agent a verified identity and spending rules it cannot break, so the business stays in control and exchanges know who is paying.',
};

const [tour, product] = LANDING_ACTIONS;

/** The public front page and About page. A short version until the full landing page is built. */
export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-primary">
      <SiteHeader />
      <main id="main" className="mx-auto grid max-w-5xl gap-8 px-4 pt-16 pb-24 lg:px-8 lg:pt-24">
        <h1 className="max-w-3xl text-display-md font-semibold text-primary lg:text-display-lg">Spending rules your AI agent cannot break.</h1>
        <p className="max-w-2xl text-lg text-tertiary">
          Tšepo gives a business’s AI agent a verified identity and spending rules it cannot break, so the business stays in
          control and exchanges know who is paying. The rules are recorded on the XRP Ledger, and an independent approval
          service signs each payment only within them.
        </p>
        <div className="flex flex-wrap gap-3">
          {tour !== undefined && (
            <Button href={tour.href} color="primary" size="xl">
              {tour.label}
            </Button>
          )}
          {product !== undefined && (
            <Button href={product.href} color="secondary" size="xl">
              {product.label}
            </Button>
          )}
          <JoinPilot />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
