import { LANDING_NOTES, SOURCES, type Source } from '../../../src/views/sources.ts';
import { Ref } from '../footnotes.tsx';
import { Section } from '../section.tsx';

interface Incident {
  name: string;
  amount: string;
  date: string;
  text: string;
  sources: Source[];
}

/** Three real incidents, told as their sources tell them. None claims a loss the source does not report. */
const INCIDENTS: Incident[] = [
  {
    name: 'Freysa',
    amount: '$47,000',
    date: 'November 2024',
    text: 'A player talked Freysa, an AI agent built to guard a prize pool, into sending all of it.',
    sources: [SOURCES.freysa],
  },
  {
    name: 'AIXBT',
    amount: 'About $106,000',
    date: 'March 2025',
    text: 'An attacker broke into the dashboard of AIXBT, an AI agent, and had it send 55.5 ETH from its wallet.',
    sources: [SOURCES.aixbt],
  },
  {
    name: 'Grok and Bankrbot',
    amount: '$150,000 to $200,000',
    date: 'May 2026',
    text: 'A hidden instruction made Grok tell Bankrbot, a trading bot, to send tokens from its wallet. The attacker returned them minutes later.',
    sources: [SOURCES.grokIncident, SOURCES.grokReturned],
  },
];

function Subhead({ children }: { children: string }) {
  return <h3 className="text-xl font-medium text-primary">{children}</h3>;
}

/**
 * The problem, in its three parts: agents have already sent money they
 * should not have, people do not trust them yet, and the law needs a name.
 * Then the positioning, in one line. Every figure carries a footnote.
 */
export function Stakes() {
  return (
    <Section id="problem" title="The problem.">
      <div className="grid gap-5">
        <Subhead>AI agents have already sent money they should not have.</Subhead>
        <ol className="grid gap-3 md:grid-cols-3">
          {INCIDENTS.map((incident) => (
            <li key={incident.name} className="grid content-start gap-2 rounded-2xl bg-secondary p-5">
              <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span className="text-display-xs font-medium text-primary tabular-nums">
                  {incident.amount}
                  <Ref notes={LANDING_NOTES} sources={incident.sources} />
                </span>
                <span className="text-sm text-tertiary">{incident.date}</span>
              </p>
              <p className="text-sm font-semibold text-primary">{incident.name}</p>
              <p className="text-sm text-secondary">{incident.text}</p>
            </li>
          ))}
        </ol>
        <p className="text-lg font-medium text-primary">In each case, nothing stood between the agent and the money.</p>
      </div>

      <div className="grid gap-8 border-t border-secondary pt-8 md:grid-cols-2 md:gap-12">
        <div className="grid content-start gap-3">
          <Subhead>People do not trust AI with money yet.</Subhead>
          <p className="text-md text-secondary">
            Only 23% of US consumers trust AI to handle payments for them, yet 61% would trust Visa to handle the same payments.
            <Ref notes={LANDING_NOTES} sources={[SOURCES.visaTrust]} /> Trust follows a known party that stands behind the payment. Tšepo
            is built to be that layer for AI agents.
          </p>
        </div>
        <div className="grid content-start gap-3">
          <Subhead>And the law needs to know who paid.</Subhead>
          <p className="text-md text-secondary">
            In South Africa, the crypto platform where the recipient receives the money, such as VALR or Luno, must know who sent every
            transfer, from R0.
            <Ref notes={LANDING_NOTES} sources={[SOURCES.directive9]} /> A payment from an agent nobody can identify cannot simply be
            accepted.
          </p>
        </div>
      </div>

      <aside aria-labelledby="why-digital-dollars" className="grid gap-2 rounded-2xl p-5 ring-1 ring-secondary">
        <h3 id="why-digital-dollars" className="text-md font-semibold text-primary">
          Why digital dollars?
        </h3>
        <p className="text-sm text-secondary">
          AI agents already pay in stablecoins: about $73 million across about 176 million agent transactions from May 2025 to April 2026,
          more than 98% of it in USDC.
          <Ref notes={LANDING_NOTES} sources={[SOURCES.keyrock]} /> On the XRP Ledger, a stablecoin payment settles in seconds, at any hour.
          The ledger itself checks the agent’s identity and both signatures, so an unknown agent is refused without any server of ours.
        </p>
      </aside>

      <p className="text-display-xs font-medium text-primary md:text-display-sm">
        Other tools stop an AI agent from paying what it should not. Tšepo also proves who the agent is, so the payments it should make are
        accepted.
      </p>
    </Section>
  );
}
