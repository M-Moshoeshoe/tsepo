import { BrandMark } from './brand.tsx';

/** The footer under every product page: what is real here, and credits for borrowed work. */
export function AppFooter() {
  return (
    <footer className="mt-16 grid gap-1 border-t border-secondary px-4 pt-6 pb-8 text-xs text-tertiary lg:px-8">
      <p className="flex items-center gap-2 text-sm font-medium text-secondary">
        <BrandMark className="size-5" />
        Tšepo, built for the Node Engine Hackathon 2026. Testnet only: no real money moves.
      </p>
      <p>
        Interface built with Untitled UI React (MIT licence) on React Aria (Apache 2.0 licence), with Untitled UI icons and
        the IBM Plex typefaces (SIL Open Font Licence).
      </p>
    </footer>
  );
}
