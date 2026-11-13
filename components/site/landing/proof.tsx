import { LinkExternal01 } from '@untitledui/icons';
import { periodText, type ProofNumbers } from '../../../src/views/proof-numbers.ts';
import { explorerUrl, PROOF_KEYS, PROOF_LINES, shortHash, type ProofFile } from '../../../src/views/proof.ts';
import { formatSastDate } from '../../../src/views/status.ts';
import { Section } from '../section.tsx';

interface Figure {
  value: string;
  label: string;
  note: string;
}

function figuresFrom(numbers: ProofNumbers): Figure[] {
  const figures: Figure[] = [];
  if (numbers.rulesHeld !== undefined) {
    const { blocked, broke } = numbers.rulesHeld;
    figures.push({
      value: `${String(blocked)} of ${String(broke)}`,
      label: blocked === broke ? 'Every attempt that broke the rules was blocked.' : 'attempts that broke the rules were blocked.',
      note: 'The approval service refused them, the XRP Ledger rejected them or the agent stopped them. None of them was paid.',
    });
  }
  if (numbers.travelRule !== undefined) {
    const { first, paid } = numbers.travelRule;
    figures.push({
      value: `${String(first)} of ${String(paid)}`,
      label: 'payments sent the Travel Rule details first.',
      note: 'The agent sent the sender and receiver details to the exchange before each payment.',
    });
  }
  const { agentWeight, quorum } = numbers.signatures;
  figures.push({
    value: `${String(agentWeight)} of ${String(quorum)}`,
    label: `The agent alone can never pay: it holds ${String(agentWeight)} of the ${String(quorum)} required signatures.`,
    note: `The agent account’s signer list on the ledger sets a quorum of ${String(quorum)} and gives the agent key a weight of ${String(agentWeight)}.`,
  });
  const { refusedAfterSeconds, ledgerIndex } = numbers.revocation;
  figures.push(
    refusedAfterSeconds === undefined
      ? { value: 'Next ledger', label: 'is when a revocation takes effect.', note: `The credential was deleted in ledger ${String(ledgerIndex)}.` }
      : {
          value: `${String(refusedAfterSeconds)} s`,
          label: 'from revocation to the first refused payment.',
          note: `The business deleted the credential in ledger ${String(ledgerIndex)}. The agent’s next payment was refused ${String(refusedAfterSeconds)} seconds after that ledger closed.`,
        },
  );
  return figures;
}

function sourceLine(numbers: ProofNumbers): string {
  const ledger = 'The signer list and the revocation are transactions on the XRP Ledger Testnet.';
  if (numbers.period === undefined) return `Counted from the service records. ${ledger}`;
  const when = periodText(formatSastDate(numbers.period.from), formatSastDate(numbers.period.to));
  return `Counted from the approval service’s log and the agent’s and exchange’s records, ${when}. ${ledger}`;
}

/** The proof in one place: four figures counted from the records, then the ledger table of real Testnet transactions. */
export function Proof({ numbers, proof }: { numbers: ProofNumbers; proof: ProofFile }) {
  return (
    <Section id="proof" title="Proof." intro={sourceLine(numbers)}>
      <dl className="grid gap-px overflow-hidden rounded-2xl bg-border-secondary ring-1 ring-secondary sm:grid-cols-2 lg:grid-cols-4">
        {figuresFrom(numbers).map((figure) => (
          <div key={figure.label} className="grid content-start gap-2 bg-primary p-6">
            <dt className="order-2 text-md font-semibold text-primary">{figure.label}</dt>
            <dd className="order-1 text-display-sm font-medium text-primary tabular-nums md:text-display-md">{figure.value}</dd>
            <dd className="order-3 text-sm text-tertiary">{figure.note}</dd>
          </div>
        ))}
      </dl>
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
