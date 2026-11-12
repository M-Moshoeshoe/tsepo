import 'server-only';
import { agentRecords } from '../../src/agent/records.ts';
import { DEMO_AGENT_NAME, DEMO_BUSINESS } from '../../src/config/demo.ts';
import type { DemoContext } from '../../src/demo/context.ts';
import type { PolicyLogEntry, ReviewLogEntry } from '../../src/policy/records.ts';
import { paymentEvidence, type PaymentEvidence } from '../../src/views/evidence.ts';
import {
  filterPayments,
  findPayment,
  instructionsFrom,
  paymentsFrom,
  type BusinessPayment,
  type Instruction,
  type PaymentQuery,
  type StatusFilter,
} from '../../src/views/payments.ts';
import { withDemo } from './ledger.ts';

export interface BusinessRecords {
  instructions: Instruction[];
  payments: BusinessPayment[];
  policyLog: PolicyLogEntry[];
}

/** The agent's instructions and payments, and the approval service's log. Read from the service records only. */
export async function readBusinessRecords(ctx: DemoContext): Promise<BusinessRecords> {
  const records = agentRecords(ctx.agentStore);
  const [runs, events, policyLog] = await Promise.all([records.runs.list(), records.events.readAll(), ctx.policy.readLog()]);
  const instructions = instructionsFrom(runs, events);
  return { instructions, payments: paymentsFrom(instructions), policyLog };
}

export interface OpenPayment {
  payment: BusinessPayment;
  instruction: Instruction;
}

export interface PaymentsView {
  shown: BusinessPayment[];
  counts: Record<StatusFilter, number>;
  paidTotal: string;
  /** Every payment ever made, before any filter, to tell "none yet" from "none match". */
  total: number;
  open: OpenPayment | undefined;
}

/** The Payments page: the filtered list, the counts, and the payment open in the details panel. */
export async function loadPayments(query: PaymentQuery): Promise<PaymentsView> {
  return withDemo(async (ctx) => {
    const { instructions, payments } = await readBusinessRecords(ctx);
    return { ...filterPayments(payments, query, new Date()), total: payments.length, open: findPayment(instructions, query.payment) };
  });
}

/** The evidence file for one payment, or undefined when no such payment exists. */
export async function loadPaymentEvidence(id: string): Promise<PaymentEvidence | undefined> {
  return withDemo(async (ctx) => {
    const { instructions, policyLog } = await readBusinessRecords(ctx);
    const found = findPayment(instructions, id);
    if (found === undefined) return undefined;
    return paymentEvidence({
      payment: found.payment,
      instructionText: found.instruction.text,
      business: { name: DEMO_BUSINESS.registeredName, ledgerAddress: ctx.wallets.business.address },
      agent: { name: DEMO_AGENT_NAME, ledgerAddress: ctx.wallets.agent.address },
      policyLog: policyLog.filter((entry): entry is ReviewLogEntry => entry.kind === 'review'),
      now: new Date(),
    });
  });
}
