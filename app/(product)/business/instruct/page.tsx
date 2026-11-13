import type { Metadata } from 'next';
import { GiveInstruction } from '../../../../components/business/give-instruction.tsx';
import { InboxWaiting } from '../../../../components/business/inbox-waiting.tsx';
import { PaymentPanel } from '../../../../components/business/payment-panel.tsx';
import { allowanceLine, latestInstruction } from '../../../../src/views/instruct.ts';
import { findPayment, parsePaymentQuery, paymentsHref } from '../../../../src/views/payments.ts';
import { loadRegistry } from '../../../_data/registry.ts';
import { loadSchedule } from '../../../_data/schedule.ts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Give an instruction, Lesedi Design Studio - Tšepo' };

const PATH = '/business/instruct';

/** Give the real agent an instruction of your own, and see what the rules decide. */
export default async function InstructPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parsePaymentQuery(await searchParams);
  const view = await loadRegistry();
  const open = findPayment(view.instructions, query.payment);
  const schedule = await loadSchedule(view.agent.status.state === 'active');

  return (
    <div className="grid max-w-3xl gap-6">
      <p className="text-md text-secondary">
        Write what {view.agent.name} should pay, as you would to a person. Thuso reads it, the approval service decides each
        payment against the spending rules, and the XRP Ledger enforces both signatures. Only approved recipients can be paid.
        It moves test funds on Testnet, so it needs the access code. Send it now, or add it to the inbox and the agent pays it
        by itself at the next scheduled run.
      </p>
      <GiveInstruction
        latest={latestInstruction(view.instructions[0], (id) => paymentsHref(PATH, { payment: id }))}
        allowance={allowanceLine({ state: view.agent.status.state, usage: view.mandate?.usage, perPaymentLimit: view.mandate?.perPaymentLimit })}
      />
      <InboxWaiting items={schedule.inbox} line={schedule.line} />
      {open !== undefined && <PaymentPanel open={open} closeHref={PATH} />}
    </div>
  );
}
