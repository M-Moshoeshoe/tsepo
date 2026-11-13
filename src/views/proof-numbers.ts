import type { PayoutRecord } from '../agent/records.ts';
import { PolicyReason } from '../domain/reasons.ts';
import type { PolicyLogEntry } from '../policy/records.ts';
import type { ProofFile } from './proof.ts';

/**
 * The four figures on the landing page, from the committed ledger evidence
 * (src/views/proof.json) and the service records. Every value is counted;
 * none is typed in. A figure the records cannot support is left out.
 */
export interface ProofNumbers {
  /** The first and last record counted, as ISO times. */
  period: { from: string; to: string } | undefined;
  /** Payment attempts the approval service refused or the XRP Ledger rejected, out of every attempt. */
  attempts: { blocked: number; total: number; percent: number } | undefined;
  /** Agent payments that sent their Travel Rule details to the exchange before they were paid. */
  travelRule: { first: number; paid: number } | undefined;
  /** The agent account's signer list: the agent's own weight against the quorum. */
  signatures: { quorum: number; agentWeight: number; approvalWeight: number };
  /** The revocation on the ledger, and how long after it the agent's next payment was refused. */
  revocation: { ledgerIndex: number; refusedAfterSeconds: number | undefined };
}

export interface ProofNumbersInput {
  proof: ProofFile;
  policyLog: readonly PolicyLogEntry[];
  agentEvents: readonly PayoutRecord[];
  /** Payments the XRP Ledger rejected, with when they closed or were recorded. */
  ledgerRejections: readonly { hash: string; at: string }[];
}

function attemptsFrom(input: ProofNumbersInput): ProofNumbers['attempts'] {
  const reviews = input.policyLog.filter((entry) => entry.kind === 'review');
  const refused = reviews.filter((entry) => entry.decision === 'refused').length;
  const rejected = new Set(input.ledgerRejections.map((item) => item.hash)).size;
  const total = reviews.length + rejected;
  if (total === 0) return undefined;
  const blocked = refused + rejected;
  return { blocked, total, percent: Math.round((blocked / total) * 100) };
}

/** A payment counts only when the agent recorded sending its details for the same invoice before it was paid. */
function travelRuleFrom(events: readonly PayoutRecord[]): ProofNumbers['travelRule'] {
  const paid = events.filter((event) => event.status === 'paid' && event.invoiceId !== undefined);
  if (paid.length === 0) return undefined;
  const first = paid.filter((payment) =>
    events.some((event) => event.status === 'package-sent' && event.invoiceId === payment.invoiceId && event.updatedAt < payment.updatedAt),
  ).length;
  return { first, paid: paid.length };
}

/** Seconds from the revocation ledger closing to the first payment refused for a missing credential, to one decimal. */
function refusedAfter(log: readonly PolicyLogEntry[], closeTime: string): number | undefined {
  const revokedAt = Date.parse(closeTime);
  const refusals = log
    .filter((entry) => entry.kind === 'review' && entry.decision === 'refused' && entry.reasons.includes(PolicyReason.CredentialMissing))
    .map((entry) => Date.parse(entry.at))
    .filter((at) => at >= revokedAt);
  if (refusals.length === 0) return undefined;
  return Math.round((Math.min(...refusals) - revokedAt) / 100) / 10;
}

function periodFrom(input: ProofNumbersInput): ProofNumbers['period'] {
  const times = [...input.policyLog.map((entry) => entry.at), ...input.agentEvents.map((event) => event.updatedAt), ...input.ledgerRejections.map((item) => item.at)]
    .map((at) => Date.parse(at))
    .filter((at) => !Number.isNaN(at));
  if (times.length === 0) return undefined;
  return { from: new Date(Math.min(...times)).toISOString(), to: new Date(Math.max(...times)).toISOString() };
}

export function proofNumbers(input: ProofNumbersInput): ProofNumbers {
  const { signerList, ledger } = input.proof;
  return {
    period: periodFrom(input),
    attempts: attemptsFrom(input),
    travelRule: travelRuleFrom(input.agentEvents),
    signatures: { quorum: signerList.quorum, agentWeight: signerList.weights.agent, approvalWeight: signerList.weights.approvalService },
    revocation: { ledgerIndex: ledger.revocation.ledgerIndex, refusedAfterSeconds: refusedAfter(input.policyLog, ledger.revocation.closeTime) },
  };
}

/** "on 12 November 2026", "from 12 to 13 November 2026", or both dates in full when the months differ. Takes formatted dates. */
export function periodText(from: string, to: string): string {
  if (from === to) return `on ${from}`;
  const [fromDay, ...fromRest] = from.split(' ');
  const [, ...toRest] = to.split(' ');
  return fromRest.join(' ') === toRest.join(' ') ? `from ${fromDay ?? from} to ${to}` : `from ${from} to ${to}`;
}
