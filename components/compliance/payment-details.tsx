import type { DeskDetail } from '../../app/_data/compliance.ts';
import type { EventState } from '../../src/views/payment-events.ts';
import { isGlossaryTerm } from '../../src/views/glossary.ts';
import { formatSast, reasonText } from '../../src/views/status.ts';
import { Amount, CopyableMono, Facts, Mono, StatusBadge } from '../display.tsx';
import { Term } from '../term.tsx';
import { Timeline, type TimelineState } from '../timeline.tsx';
import { CheckTimeline } from './check-timeline.tsx';
import { PackageDetails } from './package-details.tsx';

const EVENT_STATE: Record<EventState, { state: TimelineState; text: string }> = {
  done: { state: 'passed', text: 'Done' },
  failed: { state: 'failed', text: 'Stopped' },
  'not-reached': { state: 'pending', text: 'Not reached' },
};

/** A ledger result code, explained in plain words when it is jargon. */
function LedgerResult({ code }: { code: string }) {
  return <Mono>{isGlossaryTerm(code) ? <Term term={code}>{code}</Term> : code}</Mono>;
}

/** The top of the payment slideout: the amount in large figures and the status chip. */
export function PaymentHeader({ detail }: { detail: DeskDetail }) {
  const { entry } = detail;
  return (
    <div className="grid gap-2 pr-8">
      <p className="text-sm text-tertiary">Payment from {entry.senderName}</p>
      <p className="text-display-xs font-semibold text-primary">
        <Amount value={entry.amount} asset={entry.asset ?? 'RLUSD'} />
      </p>
      <div>
        <StatusBadge tone={entry.status.tone} size="md">
          {entry.status.chip}
        </StatusBadge>
      </div>
    </div>
  );
}

function SlideoutSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <h3 className="text-sm font-semibold text-primary">{title}</h3>
      {children}
    </section>
  );
}

/** Everything the desk knows about one payment: what happened, the checks and the travel package. */
export function PaymentDetails({ detail }: { detail: DeskDetail }) {
  const { entry } = detail;
  return (
    <div className="grid w-full gap-8">
      <p className="rounded-lg bg-secondary px-3 py-2.5 text-sm text-primary">{entry.status.label}</p>

      <SlideoutSection title="What happened">
        {/* Motion 2: the steps tick in one after another. The key restarts them for another payment. */}
        <Timeline
          key={entry.id}
          label="What happened"
          animate
          live
          items={detail.events.map((event) => ({
            id: event.id,
            label: event.label,
            state: EVENT_STATE[event.state].state,
            stateText: EVENT_STATE[event.state].text,
            detail:
              event.at === undefined && event.detail === undefined ? undefined : (
                <span className="grid gap-0.5 text-tertiary">
                  {event.at !== undefined && <span className="tabular-nums">{formatSast(event.at)}</span>}
                  {event.detail !== undefined && event.id !== 'outcome' && <span>{event.detail}</span>}
                </span>
              ),
          }))}
        />
      </SlideoutSection>

      <SlideoutSection title="Details">
        <Facts
          items={[
            { term: 'Time', value: formatSast(entry.at) },
            {
              term: 'Sender',
              value: (
                <span className="grid gap-0.5">
                  <span>{entry.senderName}</span>
                  <CopyableMono value={entry.sender} label="sender account" className="text-xs" />
                </span>
              ),
            },
            { term: 'Decided by', value: entry.decidedBy.charAt(0).toUpperCase() + entry.decidedBy.slice(1) },
            ...(entry.ledgerResult === undefined ? [] : [{ term: 'Ledger result', value: <LedgerResult code={entry.ledgerResult} /> }]),
            entry.hash === undefined
              ? { term: 'Ledger', value: <span className="text-tertiary">Never submitted. The policy service refused to co-sign.</span> }
              : { term: 'Transaction', value: <CopyableMono value={entry.hash} label="transaction hash" className="text-xs" /> },
            ...(entry.invoiceId === undefined
              ? []
              : [
                  {
                    key: 'package-fingerprint',
                    term: (
                      <>
                        Package <Term term="fingerprint">fingerprint</Term>
                      </>
                    ),
                    value: <CopyableMono value={entry.invoiceId} label="package fingerprint" className="text-xs" />,
                  },
                ]),
            ...(entry.reasons.length === 0 || entry.kind === 'rejection'
              ? []
              : [{ term: 'Reasons', value: entry.reasons.map(reasonText).join('; ') }]),
          ]}
        />
      </SlideoutSection>

      <SlideoutSection title="Checks">
        <CheckTimeline checks={detail.checks} />
      </SlideoutSection>

      <PackageDetails pkg={detail.pkg} />
    </div>
  );
}
