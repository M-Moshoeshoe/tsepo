import { ExternalLink } from 'lucide-react';
import { Mark } from './display.tsx';

const REPOSITORY = 'https://github.com/M-Moshoeshoe/tsepo';

/** The footer on every page: source, what runs where, credits and the event. */
export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-[1232px] gap-4 px-4 py-6 text-sm text-muted sm:grid-cols-[1fr_auto] sm:items-start">
        <div className="grid gap-2">
          <p className="flex items-center gap-2 font-medium text-ink">
            <Mark className="size-5" />
            Tšepo, Node Engine Hackathon 2026
          </p>
          <p>Runs on the XRP Ledger Testnet. No real money moves.</p>
          <p>
            Built with components adapted from shadcn/ui and Radix UI (MIT licence), icons from Lucide (ISC licence), and the
            IBM Plex typefaces (SIL Open Font Licence).
          </p>
        </div>
        <a
          href={REPOSITORY}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-md font-medium text-primary hover:underline"
        >
          Source on GitHub
          <ExternalLink className="size-3.5" aria-hidden />
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </footer>
  );
}
