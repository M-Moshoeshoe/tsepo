import { LinkExternal01 } from '@untitledui/icons';
import { explorerUrl, PROOF_KEYS, PROOF_LINES, shortHash, type ProofFile } from '../../../src/views/proof.ts';
import { formatSastDate } from '../../../src/views/status.ts';
import { Section } from '../section.tsx';

/** One row per XRP Ledger feature: what it proves, the result code, the ledger and the transaction, as a ledger explorer lists them. */
export function Proven({ proof }: { proof: ProofFile }) {
  return (
    <Section
      id="proven"
      title="Proven on Testnet."
      intro={`Each feature is a real transaction on the XRP Ledger Testnet, read from the validated ledger on ${formatSastDate(proof.capturedAt)}.`}
    >
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
    </Section>
  );
}
