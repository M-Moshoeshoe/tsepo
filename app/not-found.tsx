import type { Metadata } from 'next';
import { Button } from '@/components/base/buttons/button';
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
        <Button href="/about" color="primary" size="md">
          About Tšepo
        </Button>
        <Button href="/business" color="secondary" size="md">
          Business workspace
        </Button>
        <Button href="/exchange/payments" color="secondary" size="md">
          Exchange workspace
        </Button>
      </div>
    </main>
  );
}
