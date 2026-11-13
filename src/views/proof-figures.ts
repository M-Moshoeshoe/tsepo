import { formatSastDate } from './status.ts';
import { periodText, type ProofNumbers } from './proof-numbers.ts';

export interface Figure {
  value: string;
  label: string;
  note: string;
}

/** Shown in place of the figures while the records are empty, as on a fresh deployment. */
export const NO_FIGURES_YET = 'Figures appear as the agent runs.';

/**
 * The proof figures, in order. Empty while there are no records yet: a fresh
 * deployment shows a plain line and the ledger table, never zeros or a half
 * filled row.
 */
export function proofFigures(numbers: ProofNumbers): Figure[] {
  if (numbers.period === undefined) return [];
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
  figures.push({
    value: 'Next ledger',
    label: 'A revocation stops the agent from the next ledger, within seconds.',
    note: `The business deleted the credential in ledger ${String(numbers.revocation.ledgerIndex)}. From then on, the approval service refuses the agent and the exchange rejects it.`,
  });
  return figures;
}

/** Where the figures come from, and when. */
export function proofSource(numbers: ProofNumbers): string {
  const ledger = 'The signer list and the revocation are transactions on the XRP Ledger Testnet.';
  if (numbers.period === undefined) return 'The figures count what the agent does on Testnet, and the table is read from the XRP Ledger itself.';
  const when = periodText(formatSastDate(numbers.period.from), formatSastDate(numbers.period.to));
  return `Counted from the approval service’s log and the agent’s and exchange’s records, ${when}. ${ledger}`;
}

