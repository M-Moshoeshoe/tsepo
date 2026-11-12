import 'server-only';
import type { Directive9Package } from '../../src/domain/directive9.ts';
import { PolicyReason } from '../../src/domain/reasons.ts';
import { agentCredentialQuery } from '../../src/ledger/credential.ts';
import { getCredentialHistory, type CredentialEvent } from '../../src/ledger/reads.ts';
import { depositChecks, ledgerRejectionChecks, refusalChecks, type Check } from '../../src/views/checks.ts';
import { applyFilter, countByFilter, groupBySastDate, itemsSince, type DeskFilter } from '../../src/views/desk.ts';
import { depositStatus, LEDGER_REJECTION_STATUS, refusalStatus, type Status } from '../../src/views/status.ts';
import { withDemo } from './ledger.ts';

export interface DeskEntry {
  id: string;
  kind: 'deposit' | 'refusal' | 'rejection';
  at: string;
  sender: string;
  amount: string | undefined;
  asset: string | undefined;
  status: Status;
  reasons: string[];
  hash: string | undefined;
  invoiceId: string | undefined;
  ledgerResult: string | undefined;
}

export interface DeskDetail {
  entry: DeskEntry;
  checks: Check[];
  pkg: Directive9Package | undefined;
}

export interface DeskQuery {
  entryId: string | undefined;
  filter: DeskFilter;
  /** Show runs from before the last reset too. */
  earlier: boolean;
}

export interface DeskView {
  laneAddress: string;
  lastResetAt: string | undefined;
  /** Entries hidden because they are from before the last reset. */
  earlierCount: number;
  counts: Record<DeskFilter, number>;
  groups: { date: string; items: DeskEntry[] }[];
  detail: DeskDetail | undefined;
  /** True when the person chose an entry, rather than the first one being shown by default. */
  explicitlySelected: boolean;
}

/** The latest revocation of the agent credential at or before `at`. */
function revokedBefore(history: CredentialEvent[], at: string): string | undefined {
  return history.find((event) => event.type === 'CredentialDelete' && event.closeTimeIso !== undefined && event.closeTimeIso <= at)
    ?.closeTimeIso;
}

/** The compliance desk: payments into the agent lane and attempts refused before they reached it. */
export async function loadDesk(query: DeskQuery): Promise<DeskView> {
  return withDemo(async (ctx) => {
    const { client, wallets, exchange } = ctx;
    const laneAddress = wallets.exchange.address;
    const [deposits, refusals, rejections, history, lastResetAt] = await Promise.all([
      exchange.deposits(),
      exchange.refusedAttempts(),
      exchange.ledgerRejections(),
      getCredentialHistory(client, agentCredentialQuery(wallets.agent.address, wallets.issuer.address)),
      ctx.demo.lastResetAt(),
    ]);

    const all: DeskEntry[] = [
      ...deposits.map((deposit) => ({
        id: `d-${deposit.hash}`,
        kind: 'deposit' as const,
        at: deposit.closeTimeIso ?? deposit.recordedAt,
        sender: deposit.sender,
        amount: deposit.amount,
        asset: deposit.asset,
        status: depositStatus(deposit),
        reasons: deposit.reasons,
        hash: deposit.hash,
        invoiceId: deposit.invoiceId,
        ledgerResult: deposit.ledgerResult,
      })),
      ...refusals.map((refusal) => {
        const revokedAt =
          refusal.agent === wallets.agent.address && refusal.reasons.includes(PolicyReason.CredentialMissing)
            ? revokedBefore(history, refusal.at)
            : undefined;
        return {
          id: `r-${refusal.at}`,
          kind: 'refusal' as const,
          at: refusal.at,
          sender: refusal.agent ?? 'Unknown account',
          amount: refusal.amount,
          asset: refusal.asset,
          status: refusalStatus(refusal.reasons, revokedAt),
          reasons: refusal.reasons,
          hash: undefined,
          invoiceId: refusal.invoiceId,
          ledgerResult: undefined,
        };
      }),
      ...rejections.map((rejection) => ({
        id: `x-${rejection.hash}`,
        kind: 'rejection' as const,
        at: rejection.closeTimeIso ?? rejection.recordedAt,
        sender: rejection.sender,
        amount: rejection.amount,
        asset: rejection.asset,
        status: LEDGER_REJECTION_STATUS,
        reasons: [rejection.ledgerResult],
        hash: rejection.hash,
        invoiceId: undefined,
        ledgerResult: rejection.ledgerResult,
      })),
    ];

    const sinceReset = itemsSince(all, lastResetAt);
    const windowed = query.earlier ? itemsSince(all, undefined) : sinceReset;
    const visible = applyFilter(windowed, query.filter);
    const chosen = windowed.find((entry) => entry.id === query.entryId);
    const entry = chosen ?? visible[0];

    let detail: DeskDetail | undefined;
    if (entry !== undefined) {
      const stored = entry.invoiceId === undefined ? undefined : await exchange.packageFor(entry.invoiceId);
      const pkg = stored?.package;
      const deposit = entry.kind === 'deposit' ? deposits.find((record) => record.hash === entry.hash) : undefined;
      const checks =
        entry.kind === 'deposit'
          ? depositChecks(entry, pkg, laneAddress, deposit?.destinationTag ?? pkg?.beneficiary.destinationTag)
          : entry.kind === 'refusal'
            ? refusalChecks(entry.reasons, pkg !== undefined)
            : ledgerRejectionChecks();
      detail = { entry, checks, pkg };
    }

    return {
      laneAddress,
      lastResetAt,
      earlierCount: all.length - sinceReset.length,
      counts: countByFilter(windowed),
      groups: groupBySastDate(visible),
      detail,
      explicitlySelected: chosen !== undefined,
    };
  });
}
