import { periodText, type ProofNumbers } from '../../../src/views/proof-numbers.ts';
import { formatSastDate } from '../../../src/views/status.ts';
import { Section } from '../section.tsx';

interface Figure {
  value: string;
  label: string;
  note: string;
}

function figuresFrom(numbers: ProofNumbers): Figure[] {
  const figures: Figure[] = [];
  if (numbers.attempts !== undefined) {
    const { blocked, total, percent } = numbers.attempts;
    figures.push({
      value: `${String(percent)}%`,
      label: 'of payment attempts were blocked.',
      note: `The approval service refused or the XRP Ledger rejected ${String(blocked)} of ${String(total)} attempts.`,
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
    label: 'signatures can come from the agent.',
    note: `The signer list gives the agent key a weight of ${String(agentWeight)} against a quorum of ${String(quorum)}, so the agent cannot pay alone.`,
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

/** Four figures counted from the ledger evidence and the records, with their source. */
export function Numbers({ numbers }: { numbers: ProofNumbers }) {
  return (
    <Section id="numbers" title="Proof in numbers." intro={sourceLine(numbers)}>
      <dl className="grid gap-px overflow-hidden rounded-2xl bg-border-secondary ring-1 ring-secondary sm:grid-cols-2 lg:grid-cols-4">
        {figuresFrom(numbers).map((figure) => (
          <div key={figure.label} className="grid content-start gap-2 bg-primary p-6">
            <dt className="order-2 text-md font-semibold text-primary">{figure.label}</dt>
            <dd className="order-1 text-display-sm font-medium text-primary tabular-nums md:text-display-md">{figure.value}</dd>
            <dd className="order-3 text-sm text-tertiary">{figure.note}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
