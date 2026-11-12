import type { OpenPayment } from '../../app/_data/business.ts';
import type { PayoutStep } from '../../src/views/activity.ts';
import { outcomeNote, readNote } from '../../src/views/assistant.ts';
import { paymentDecision, STATUS_LABELS, STATUS_TONES } from '../../src/views/payments.ts';
import { formatSast, reasonText } from '../../src/views/status.ts';
import { AssistantNote, DecisionBox } from '../assistant-note.tsx';
import { DetailsPanel } from '../details-panel.tsx';
import { Amount, CopyableMono, ExplorerLink, Facts, StatusBadge } from '../display.tsx';
import { Term } from '../term.tsx';
import { Timeline, type TimelineState } from '../timeline.tsx';
import { EvidenceButton } from './evidence-button.tsx';

const STEP_STATE: Record<PayoutStep['state'], { state: TimelineState; text: string }> = {
  done: { state: 'passed', text: 'Done' },
  failed: { state: 'failed', text: 'Stopped here' },
  'not-reached': { state: 'pending', text: 'Not reached' },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      {children}
    </section>
  );
}

/** One business payment in the details panel: the decision, what Thuso did, the steps, the evidence and the instruction. */
export function PaymentPanel({ open, closeHref }: { open: OpenPayment; closeHref: string }) {
  const { payment, instruction } = open;
  const decision = paymentDecision(payment);
  const note = outcomeNote(payment);
  const paid = payment.status === 'paid' && payment.hash !== undefined;

  return (
    <DetailsPanel
      key={payment.id}
      label="Payment details"
      closeHref={closeHref}
      header={
        <div className="grid gap-2 pr-8">
          <p className="text-sm text-tertiary">Payment to {payment.intent.payee}</p>
          <p className="text-display-xs font-semibold text-primary">
            <Amount value={payment.intent.amount} />
          </p>
          <div>
            <StatusBadge tone={STATUS_TONES[payment.status]} size="md">
              {STATUS_LABELS[payment.status]}
            </StatusBadge>
          </div>
        </div>
      }
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <EvidenceButton paymentId={payment.id} />
          {paid && <ExplorerLink hash={payment.hash ?? ''}>View on the XRP Ledger</ExplorerLink>}
        </div>
      }
    >
      <div className="grid w-full gap-8">
        <div className="grid gap-3">
          {decision !== undefined && <DecisionBox decidedBy={decision.decidedBy}>{decision.text}</DecisionBox>}
          {note !== undefined && <AssistantNote>{note}</AssistantNote>}
        </div>

        <Section title="What happened">
          <Timeline
            label="What happened"
            items={payment.steps.map((step) => ({
              id: step.id,
              label: step.label,
              state: STEP_STATE[step.state].state,
              stateText: STEP_STATE[step.state].text,
              detail: step.hash === undefined ? undefined : <ExplorerLink hash={step.hash}>Transaction</ExplorerLink>,
            }))}
          />
        </Section>

        <Section title="Details">
          <Facts
            items={[
              { term: 'Reference', value: <span className="tabular-nums">{payment.intent.reference}</span> },
              { term: 'Recipient', value: payment.intent.payee },
              { term: 'Purpose', value: payment.intent.purpose },
              { term: 'Last change', value: formatSast(payment.at) },
              ...(paid ? [{ term: 'Transaction', value: <CopyableMono value={payment.hash ?? ''} label="transaction hash" className="text-xs" /> }] : []),
              ...(payment.invoiceId === undefined
                ? []
                : [
                    {
                      key: 'travel-rule',
                      term: (
                        <>
                          <Term term="travel-rule">Travel Rule</Term> reference
                        </>
                      ),
                      value: <CopyableMono value={payment.invoiceId} label="Travel Rule reference" className="text-xs" />,
                    },
                  ]),
              ...(payment.reasons.length === 0 ? [] : [{ term: 'Reasons', value: payment.reasons.map(reasonText).join('; ') }]),
            ]}
          />
        </Section>

        <Section title="The instruction">
          <p className="text-sm text-tertiary">Received {formatSast(instruction.at)}</p>
          <blockquote className="rounded-lg bg-secondary px-3 py-2.5 text-sm whitespace-pre-wrap text-primary">{instruction.text}</blockquote>
          <AssistantNote>{readNote(instruction.intents)}</AssistantNote>
        </Section>
      </div>
    </DetailsPanel>
  );
}
