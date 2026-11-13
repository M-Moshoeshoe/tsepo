import { LinkExternal01 } from '@untitledui/icons';
import { NO_FIGURES_YET, proofFigures, proofSource } from '../../../src/views/proof-figures.ts';
import type { ProofNumbers } from '../../../src/views/proof-numbers.ts';
import { explorerUrl, PROOF_KEYS, PROOF_LINES, shortHash, type ProofFile } from '../../../src/views/proof.ts';
import { formatSastDate } from '../../../src/views/status.ts';
import { Section } from '../section.tsx';

/** One column per figure on a wide screen, so a shorter set never leaves an empty cell. */
const WIDE_COLUMNS: Record<number, string> = { 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-2 lg:grid-cols-4' };

/** The proof in one place: four figures counted from the records, then the ledger table of real Testnet transactions. */
export function Proof({ numbers, proof }: { numbers: ProofNumbers; proof: ProofFile }) {
  const figures = proofFigures(numbers);
  return (
    <Section id="proof" title="Proof." intro={proofSource(numbers)}>
      {figures.length === 0 ? (
        <p className="rounded-2xl bg-secondary px-6 py-5 text-md text-secondary">{NO_FIGURES_YET}</p>
      ) : (
        <dl className={`grid gap-px overflow-hidden rounded-2xl bg-border-secondary ring-1 ring-secondary ${WIDE_COLUMNS[figures.length] ?? ''}`}>
          {figures.map((figure) => (
            <div key={figure.label} className="grid content-start gap-2 bg-primary p-6">
              <dt className="order-2 text-md font-semibold text-primary">{figure.label}</dt>
              <dd className="order-1 text-display-sm font-medium text-primary tabular-nums md:text-display-md">{figure.value}</dd>
              <dd className="order-3 text-sm text-tertiary">{figure.note}</dd>
            </div>
          ))}
        </dl>
      )}
      <div className="grid gap-4">
        <h3 className="text-lg font-semibold text-primary">Proven on Testnet</h3>
        <p className="text-md text-tertiary">
          Each feature is a real transaction on the XRP Ledger Testnet, read from the validated ledger on {formatSastDate(proof.capturedAt)}.
        </p>
        <div className="overflow-hidden rounded-2xl ring-1 ring-secondary">
          <table className="w-full table-fixed border-collapse text-left">
            <caption className="sr-only">XRP Ledger Testnet transactions that prove each feature</caption>
            <thead className="bg-secondary text-xs font-semibold text-tertiary">
              <tr>
                <th scope="col" className="px-4 py-3 md:px-6">
                  Feature
                </th>
                <th scope="col" className="hidden w-44 px-4 py-3 md:table-cell">
                  Result
                </th>
                <th scope="col" className="hidden w-32 px-4 py-3 lg:table-cell">
                  Ledger
                </th>
                <th scope="col" className="w-36 px-4 py-3 md:w-44 md:px-6">
                  Transaction
                </th>
              </tr>
            </thead>
            <tbody>
              {PROOF_KEYS.map((key) => {
                const facts = proof.ledger[key];
                const hash = proof.transactions[key];
                return (
                  <tr key={key} className="border-t border-secondary align-top">
                    <th scope="row" className="px-4 py-4 text-left font-normal md:px-6">
                      <p className="text-sm font-semibold text-primary">{PROOF_LINES[key].title}</p>
                      <p className="text-sm text-tertiary">{PROOF_LINES[key].line}</p>
                      <p className="mt-1 font-mono text-xs text-secondary md:hidden">{facts.result}</p>
                    </th>
                    <td className="hidden px-4 py-4 font-mono text-xs text-primary md:table-cell">{facts.result}</td>
                    <td className="hidden px-4 py-4 font-mono text-xs text-secondary lg:table-cell">{facts.ledgerIndex}</td>
                    <td className="px-4 py-4 md:px-6">
                      <a
                        href={explorerUrl(hash)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-sm font-mono text-xs font-medium text-brand-secondary outline-focus-ring hover:text-brand-secondary_hover focus-visible:outline-2"
                      >
                        {shortHash(hash)}
                        <LinkExternal01 className="size-3.5 shrink-0" aria-hidden />
                        <span className="sr-only">, open the full transaction on the explorer (opens in a new tab)</span>
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}
