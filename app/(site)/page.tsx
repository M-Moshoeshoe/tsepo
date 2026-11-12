import type { Metadata } from 'next';
import { Button } from '@/components/base/buttons/button';
import { Brand } from '../../components/shell/brand.tsx';

export const metadata: Metadata = {
  title: 'Tšepo: spending rules your AI agent cannot break',
  description:
    'Tšepo gives a business’s AI agent a verified identity and spending rules it cannot break, so the business stays in control and exchanges know who is paying.',
};

/** The public front page. A short version until the full landing page is built. */
export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-primary">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6 lg:px-8">
        <Brand />
        <Button href="/business" color="link-color" size="md">
          Open the product
        </Button>
      </header>
      <main id="main" className="mx-auto grid max-w-5xl gap-8 px-4 pt-16 pb-24 lg:px-8 lg:pt-24">
        <h1 className="max-w-3xl text-display-md font-semibold text-primary lg:text-display-lg">Spending rules your AI agent cannot break.</h1>
        <p className="max-w-2xl text-lg text-tertiary">
          Tšepo gives a business’s AI agent a verified identity and spending rules it cannot break, so the business stays in
          control and exchanges know who is paying. The rules are recorded on the XRP Ledger, and an independent approval
          service signs each payment only within them.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button href="/business?tour" color="primary" size="xl">
            Take the guided tour
          </Button>
          <Button href="/business" color="secondary" size="xl">
            Open the product
          </Button>
        </div>
      </main>
      <footer className="mx-auto max-w-5xl px-4 pb-10 text-sm text-tertiary lg:px-8">
        Testnet only. No real money moves. Sample businesses and people are fictional.
      </footer>
    </div>
  );
}
