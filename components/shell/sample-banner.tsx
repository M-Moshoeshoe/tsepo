import { Term } from '../term.tsx';

/**
 * One slim, persistent line for the whole product, so no screen needs its own
 * "sample" tag: the network is a test network, and the businesses and people
 * in it are invented.
 */
export function SampleBanner() {
  return (
    <p className="flex items-center justify-center gap-2 border-b border-secondary bg-secondary px-4 py-1.5 text-xs text-tertiary">
      <Term term="sample-workspace">Testnet. Sample businesses and people.</Term>
    </p>
  );
}
