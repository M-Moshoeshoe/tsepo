import { Term } from '../term.tsx';

/** The footer under every product page: one line on what is real here. Credits live on the About page. */
export function AppFooter() {
  return (
    <footer className="mt-16 border-t border-secondary px-4 pt-6 pb-8 text-sm text-tertiary lg:px-8">
      <p>
        <Term term="sample-workspace">Testnet. Sample businesses and people.</Term>
      </p>
    </footer>
  );
}
