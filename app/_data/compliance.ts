import 'server-only';
import type { Directive9Package } from '../../src/domain/directive9.ts';
import { depositChecks, ledgerRejectionChecks, refusalChecks, type Check } from '../../src/views/checks.ts';
import { applyFilter, countByFilter, itemsSince, type DeskFilter } from '../../src/views/desk.ts';
import { paymentEvents, type PaymentEvent } from '../../src/views/payment-events.ts';
import { collectDeskEntries, type DeskEntry } from './desk-entries.ts';
import { withDemo } from './ledger.ts';

export type { DeskEntry } from './desk-entries.ts';

export interface DeskDetail {
  entry: DeskEntry;
  events: PaymentEvent[];
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
  /** The entries under the chosen filter, newest first. */
  entries: DeskEntry[];
  /** The entry the person opened, if any. */
  detail: DeskDetail | undefined;
}

/** The compliance desk: payments into the agent lane and attempts stopped before they reached it. */
export async function loadDesk(query: DeskQuery): Promise<DeskView> {
  return withDemo(async (ctx) => {
    const laneAddress = ctx.wallets.exchange.address;
    const { entries: all, deposits, lastResetAt } = await collectDeskEntries(ctx);

    const sinceReset = itemsSince(all, lastResetAt);
    const windowed = query.earlier ? itemsSince(all, undefined) : sinceReset;
    const entry = all.find((item) => item.id === query.entryId);

    let detail: DeskDetail | undefined;
    if (entry !== undefined) {
      const stored = entry.invoiceId === undefined ? undefined : await ctx.exchange.packageFor(entry.invoiceId);
      const pkg = stored?.package;
      const deposit = entry.kind === 'deposit' ? deposits.find((record) => record.hash === entry.hash) : undefined;
      const checks =
        entry.kind === 'deposit'
          ? depositChecks(entry, pkg, laneAddress, deposit?.destinationTag ?? pkg?.beneficiary.destinationTag)
          : entry.kind === 'refusal'
            ? refusalChecks(entry.reasons, pkg !== undefined)
            : ledgerRejectionChecks();
      const events = paymentEvents({ kind: entry.kind, at: entry.at, status: entry.status, checks, packageReceivedAt: stored?.receivedAt });
      detail = { entry, events, checks, pkg };
    }

    return {
      laneAddress,
      lastResetAt,
      earlierCount: all.length - sinceReset.length,
      counts: countByFilter(windowed),
      entries: applyFilter(windowed, query.filter),
      detail,
    };
  });
}
