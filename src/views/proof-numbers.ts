import type { PayoutRecord } from '../agent/records.ts';
import { AgentReason, PolicyReason } from '../domain/reasons.ts';
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
  /** Attempts that broke a rule, and how many of them were blocked: never paid. */
  rulesHeld: { broke: number; blocked: number } | undefined;
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
  /** The invoice of every deposit the exchange received, so a refused payment that arrived anyway would show. */
  depositInvoices: readonly (string | undefined)[];
}

/** The agent's own refusals for a rule: a payee who is not approved, or no spending rules at all. */
const AGENT_RULE_REASONS: readonly string[] = [AgentReason.PayeeUnknown, AgentReason.NoMandate];

/**
 * Every attempt that broke a rule, and how many were blocked. An attempt
 * broke a rule when the approval service refused it for any reason but its
 * own error, when the XRP Ledger rejected it, or when the agent itself
 * refused an unapproved payee. A refusal counts as blocked only when no
 * payment with its invoice was ever paid or received: the figure is checked
 * against the money, not taken from the refusal.
 */
function rulesHeldFrom(input: ProofNumbersInput): ProofNumbers['rulesHeld'] {
  const settled = new Set([
    ...input.agentEvents.filter((event) => event.status === 'paid').map((event) => event.invoiceId),
    ...input.depositInvoices,
  ]);
  settled.delete(undefined);
  const refusals = input.policyLog.filter(
    (entry) => entry.kind === 'review' && entry.decision === 'refused' && entry.reasons.some((reason) => reason !== PolicyReason.ServiceError),
  );
  const refusedBlocked = refusals.filter((entry) => entry.kind === 'review' && (entry.invoiceId === undefined || !settled.has(entry.invoiceId))).length;
  // A tec result moves no money, so every ledger rejection is blocked.
  const rejected = new Set(input.ledgerRejections.map((item) => item.hash)).size;
  // The agent refuses before anything is signed, so nothing can be paid.
  const agentRefused = new Set(
    input.agentEvents
      .filter((event) => event.status === 'refused' && event.reasons.some((reason) => AGENT_RULE_REASONS.includes(reason)))
      .map((event) => `${event.reference}@${event.updatedAt}`),
  ).size;
  const broke = refusals.length + rejected + agentRefused;
  if (broke === 0) return undefined;
  return { broke, blocked: refusedBlocked + rejected + agentRefused };
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
    rulesHeld: rulesHeldFrom(input),
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
