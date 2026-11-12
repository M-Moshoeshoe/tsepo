/** The footer under every page: where it runs, the event, and credits for borrowed work. */
export function AppFooter() {
  return (
    <footer className="mt-16 grid gap-1 px-4 pt-6 pb-8 text-xs text-tertiary lg:px-8">
      <p className="text-sm font-medium text-secondary">Runs on the XRP Ledger Testnet. No real money moves.</p>
      <p>Tšepo, Node Engine Hackathon 2026.</p>
      <p>
        Interface built with Untitled UI React (MIT licence) on React Aria (Apache 2.0 licence), with Untitled UI icons and
        the IBM Plex typefaces (SIL Open Font Licence).
      </p>
    </footer>
  );
}
