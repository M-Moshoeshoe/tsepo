import 'server-only';
import { DEMO_BUSINESS } from '../../src/config/demo.ts';
import type { DecisionRecord } from '../../src/views/reports.ts';
import { reasonText } from '../../src/views/status.ts';
import { collectDeskEntries } from './desk-entries.ts';
import { withDemo } from './ledger.ts';

/**
 * Every decision at the agent deposit address, as report records. The
 * originator and beneficiary come from the Travel Rule details the exchange
 * received before the payment; an attempt that sent none names the business
 * only when the sender is a registered agent of it.
 */
export async function loadDecisionRecords(): Promise<DecisionRecord[]> {
  return withDemo(async (ctx) => {
    const { entries } = await collectDeskEntries(ctx);
    return Promise.all(
      entries.map(async (entry): Promise<DecisionRecord> => {
        const stored = entry.invoiceId === undefined ? undefined : await ctx.exchange.packageFor(entry.invoiceId);
        const details = stored?.package;
        const isAgent = entry.sender === ctx.wallets.agent.address;
        return {
          time: entry.at,
          transactionHash: entry.hash ?? '',
          sender: entry.sender,
          originatorBusiness: details?.originator.registeredName ?? (isAgent ? DEMO_BUSINESS.registeredName : ''),
          originatorRegistration: details?.originator.registrationNumber ?? (isAgent ? DEMO_BUSINESS.registrationNumber : ''),
          beneficiary: details?.beneficiary.name ?? '',
          amount: entry.amount ?? '',
          asset: entry.asset ?? '',
          travelRuleReference: entry.invoiceId ?? '',
          outcome: entry.status.label,
          reasons: entry.reasons.map(reasonText).join('; '),
        };
      }),
    );
  });
}
