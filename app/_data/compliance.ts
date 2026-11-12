import 'server-only';
import type { Directive9Package } from '../../src/domain/directive9.ts';
import { depositChecks, ledgerRejectionChecks, refusalChecks, type Check } from '../../src/views/checks.ts';
import type { DatePreset } from '../../src/views/date-range.ts';
import { applyFilter, countByFilter, itemsInRange, outcomesByDay, type DeskFilter, type OutcomeDay } from '../../src/views/desk.ts';
import type { Category } from '../../src/views/status.ts';
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
  range: DatePreset;
}

export interface DeskView {
  laneAddress: string;
  counts: Record<DeskFilter, number>;
  /** Outcomes per SAST day in the date range, for the chart. Its totals equal the counts. */
  outcomes: { days: OutcomeDay[]; totals: Record<Category, number> };
  /** Every entry ever recorded, before any filter, to tell "none yet" from "none match". */
  total: number;
  /** The entries under the chosen filter, newest first. */
  entries: DeskEntry[];
  /** The entry the person opened, if any. */
  detail: DeskDetail | undefined;
}

/** Incoming payments: payments to the agent deposit address and attempts stopped before they reached it. */
export async function loadDesk(query: DeskQuery): Promise<DeskView> {
  return withDemo(async (ctx) => {
    const laneAddress = ctx.wallets.exchange.address;
    const { entries: all, deposits } = await collectDeskEntries(ctx);
    const now = new Date();
    const windowed = itemsInRange(all, query.range, now);
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
      counts: countByFilter(windowed),
      outcomes: outcomesByDay(all, query.range, now),
      total: all.length,
      entries: applyFilter(windowed, query.filter),
      detail,
    };
  });
}
