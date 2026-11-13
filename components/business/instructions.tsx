import { readNote, readSummary } from '../../src/views/assistant.ts';
import { instructionOutcome, type Instruction } from '../../src/views/payments.ts';
import { storyTitle } from '../../src/views/scenarios.ts';
import { formatSast } from '../../src/views/status.ts';
import { EmptyMessage } from '../empty-message.tsx';
import { InstructionInbox } from './instruction-inbox.tsx';

/** Every instruction the agent received, as an inbox. Thuso's words are worked out here, on the server, from the records. */
export function Instructions({ instructions, hrefFor }: { instructions: Instruction[]; hrefFor: (paymentId: string) => string }) {
  if (instructions.length === 0) {
    return (
      <EmptyMessage title="No payments yet.">
        {`No instructions yet. Give the agent one, or run "${storyTitle('scenario-2')}" in the tour.`}
      </EmptyMessage>
    );
  }
  return (
    <InstructionInbox
      rows={instructions.map((instruction) => ({
        id: instruction.runId.replace(/[^0-9A-Za-z]/g, ''),
        time: formatSast(instruction.at),
        startedBy: instruction.startedBy === 'schedule' ? 'Started by the schedule' : 'Started by a person',
        summary: readSummary(instruction.intents),
        outcome: instructionOutcome(instruction.payments),
        text: instruction.text,
        note: readNote(instruction.intents),
        payments: instruction.payments.map((payment) => ({ payment, href: hrefFor(payment.id) })),
      }))}
    />
  );
}
