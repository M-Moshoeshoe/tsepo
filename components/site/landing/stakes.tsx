import { Section } from '../section.tsx';

interface Row {
  term: string;
  text: string;
}

const WITHOUT: Row[] = [
  { term: 'Frozen', text: 'The exchange cannot tell who sent the payment, so it freezes it for review.' },
  { term: 'Unchecked', text: 'The business gives the agent a key, and nothing checks what it pays.' },
  { term: 'Unstoppable', text: 'Stopping the agent means moving the funds and replacing the keys.' },
  { term: 'Unproven', text: 'Nobody can show which rule allowed a payment, or who decided it.' },
];

const WITH: Row[] = [
  { term: 'Verified', text: 'The agent holds a credential on the XRP Ledger that anyone can check.' },
  { term: 'Limited', text: 'The approval service signs only the payments that are within the spending rules.' },
  { term: 'Accepted', text: 'The exchange receives the Travel Rule details before the money arrives.' },
  { term: 'Stoppable', text: 'The business revokes the agent, and its next payment is refused.' },
];

function Column({ title, rows, tone }: { title: string; rows: Row[]; tone: 'without' | 'with' }) {
  return (
    <div className={tone === 'without' ? 'grid content-start gap-5 bg-secondary p-6 md:p-8' : 'grid content-start gap-5 bg-primary p-6 md:p-8'}>
      <h3 className="text-lg font-semibold text-primary">{title}</h3>
      <dl className="grid">
        {rows.map((row) => (
          <div key={row.term} className="grid gap-1 border-t border-secondary py-3.5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-4">
            <dt className={tone === 'with' ? 'text-md font-semibold text-brand-secondary' : 'text-md font-semibold text-tertiary'}>{row.term}</dt>
            <dd className={tone === 'with' ? 'text-md text-primary' : 'text-md text-tertiary'}>{row.text}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** The positioning, then what an agent payment looks like without Tšepo and with it. */
export function Stakes() {
  return (
    <Section
      id="stakes"
      statement
      title="Other tools stop an AI agent from paying what it should not. Tšepo also proves who the agent is, so the payments it should make are accepted."
    >
      <div className="grid overflow-hidden rounded-2xl ring-1 ring-secondary md:grid-cols-2">
        <Column title="Without Tšepo" rows={WITHOUT} tone="without" />
        <Column title="With Tšepo" rows={WITH} tone="with" />
      </div>
    </Section>
  );
}
