import { readNote } from '../../src/views/assistant.ts';
import type { Instruction } from '../../src/views/payments.ts';
import { storyTitle } from '../../src/views/scenarios.ts';
import { formatSast } from '../../src/views/status.ts';
import { AssistantNote } from '../assistant-note.tsx';
import { EmptyMessage } from '../empty-message.tsx';
import { PaymentList } from './payment-list.tsx';

/** How many instructions to show before the list moves to the Payments page. */
const SHOWN = 5;

/** Each instruction the agent received, what Thuso read in it, and what happened to each payment. */
export function Instructions({ instructions, hrefFor }: { instructions: Instruction[]; hrefFor: (paymentId: string) => string }) {
  if (instructions.length === 0) {
    return (
      <EmptyMessage title="No payments yet.">
        {`No instructions yet. Run "${storyTitle('scenario-2')}" in the guided tour to see what the agent reads and pays.`}
      </EmptyMessage>
    );
  }
  return (
    <ol className="grid gap-4" aria-label="Instructions, newest first">
      {instructions.slice(0, SHOWN).map((instruction) => (
        <li key={instruction.runId} className="grid gap-3 rounded-xl p-4 ring-1 ring-secondary ring-inset lg:p-5">
          <p className="text-sm text-tertiary">Instruction from the business, received {formatSast(instruction.at)}</p>
          <blockquote className="rounded-lg bg-secondary px-3 py-2.5 text-sm whitespace-pre-wrap text-primary">{instruction.text}</blockquote>
          <AssistantNote>{readNote(instruction.intents)}</AssistantNote>
          {instruction.payments.length > 0 && (
            <PaymentList
              label={`Payments read from the instruction received ${formatSast(instruction.at)}`}
              items={instruction.payments.map((payment) => ({ payment, href: hrefFor(payment.id) }))}
            />
          )}
        </li>
      ))}
    </ol>
  );
}
