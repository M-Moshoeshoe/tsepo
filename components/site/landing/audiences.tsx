import { Check } from '@untitledui/icons';
import type { ReactNode } from 'react';
import { EXAMPLE_PAYMENTS_CENTS, feeBound, feePerSideCents, formatRand } from '../../../src/domain/pricing.ts';
import type { ProofFile } from '../../../src/views/proof.ts';
import { LANDING_NOTES, SOURCES } from '../../../src/views/sources.ts';
import { Ref } from '../footnotes.tsx';
import { JoinPilot } from '../join-pilot.tsx';
import { Section } from '../section.tsx';
import { SiteButton } from '../site-button.tsx';

/** The pilot pricing in one sentence, as the business and the platform both read it. */
export const PRICING_LINE =
  'Pilot pricing, to be validated: 0.25% of each payment, charged to each side: the business whose agent sends it, and the platform that receives it. Minimum R0.50 and maximum R25 per side, per payment. No monthly fees.';

function Points({ lines }: { lines: string[] }) {
  return (
    <ul className="grid gap-2">
      {lines.map((line) => (
        <li key={line} className="flex items-start gap-2 text-sm text-secondary">
          <Check className="mt-0.5 size-4 shrink-0 text-fg-brand-primary" aria-hidden />
          {line}
        </li>
      ))}
    </ul>
  );
}

/** One side of the block: the name, the price as the largest element, three points, an extra line and one button. */
function Column({ id, name, points, extra }: { id: string; name: string; points: string[]; extra: ReactNode }) {
  return (
    <article id={id} aria-labelledby={`${id}-name`} className="grid scroll-mt-4 content-start gap-4 p-5 md:p-6">
      <h3 id={`${id}-name`} className="text-md font-semibold text-primary">
        {name}
      </h3>
      <p className="grid gap-0.5">
        <span className="text-display-sm font-medium text-primary tabular-nums">
          0.25% <span className="text-lg text-tertiary">per payment</span>
        </span>
        <span className="text-sm text-tertiary">Minimum R0.50, maximum R25. No monthly fees.</span>
      </p>
      <Points lines={points} />
      {extra}
      <JoinPilot variant="primary" size="lg" className="justify-self-start" />
    </article>
  );
}

/** Who must approve each payment, in one line, read from the agent account's signer list on the ledger. */
function Approvers({ proof }: { proof: ProofFile }) {
  const { quorum, weights } = proof.signerList;
  return (
    <div className="grid gap-1 rounded-lg bg-secondary px-3 py-2.5 text-sm">
      <p className="font-medium text-primary">
        Agent ({weights.agent}) + Approval service ({weights.approvalService}) = {quorum} signatures needed
      </p>
      <p className="text-xs text-tertiary">
        The agent can never pay alone. The business recovery key ({weights.business}) can act alone, for recovery.
      </p>
    </div>
  );
}

/** Three example payments, worked out by the pricing rules, never typed in. */
export function Examples() {
  return (
    <table className="w-full max-w-md text-left text-sm">
      <caption className="pb-2 text-left text-sm font-semibold text-primary">What each side pays</caption>
      <thead className="text-xs text-tertiary">
        <tr>
          <th scope="col" className="py-1.5 font-medium">
            Payment
          </th>
          <th scope="col" className="py-1.5 font-medium">
            Each side pays
          </th>
        </tr>
      </thead>
      <tbody className="tabular-nums">
        {EXAMPLE_PAYMENTS_CENTS.map((cents) => {
          const bound = feeBound(cents);
          return (
            <tr key={cents} className="border-t border-secondary">
              <th scope="row" className="py-1.5 font-normal text-secondary">
                {formatRand(cents)}
              </th>
              <td className="py-1.5 text-primary">
                {formatRand(feePerSideCents(cents))}
                {bound !== undefined && <span className="text-tertiary">{bound === 'minimum' ? ', the minimum' : ', the cap'}</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/** How the pilot reaches its first customers. Plain facts: no partnership is claimed. */
const GO_TO_MARKET: { term: string; text: string }[] = [
  {
    term: 'First customers',
    text: 'South African crypto platforms, which must know who sent every transfer under Directive 9, and businesses that pay contractors through AI agents.',
  },
  { term: 'Why now', text: 'Directive 9 has applied from R0 since 30 April 2025, and AI agents already pay in stablecoins.' },
  {
    term: 'How we reach them',
    text: 'Through the Travel Rule providers that platforms already use, such as Notabene and Sumsub. Each platform then brings its business clients.',
  },
  { term: 'The pilot', text: 'Three businesses and one receiving platform on the XRP Ledger Testnet, then a supervised pilot.' },
];

function GoToMarket() {
  return (
    <div className="grid gap-4 border-t border-secondary pt-6">
      <h3 className="text-md font-semibold text-primary">How the pilot reaches its first customers</h3>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {GO_TO_MARKET.map((item) => (
          <div key={item.term} className="grid content-start gap-1">
            <dt className="text-sm font-semibold text-primary">{item.term}</dt>
            <dd className="text-sm text-tertiary">{item.text}</dd>
          </div>
        ))}
      </dl>
      <SiteButton href="/market" variant="quiet" size="md" className="justify-self-start">
        Read about the market
      </SiteButton>
    </div>
  );
}

/** Pricing for both sides of the payment, one slim block, with the worked examples and how the pilot reaches its customers. */
export function Audiences({ proof }: { proof: ProofFile }) {
  return (
    <Section id="pricing" title="Pricing, per payment, for both sides." intro={PRICING_LINE}>
      <div className="grid gap-6">
        <div className="grid divide-y divide-secondary rounded-2xl ring-1 ring-secondary md:grid-cols-2 md:divide-x md:divide-y-0">
          <Column
            id="for-businesses"
            name="For businesses"
            points={[
              'Your agent pays only approved recipients, within its limits.',
              'One action stops the agent within seconds.',
              'Every payment keeps its instruction, decision and ledger record.',
            ]}
            extra={<Approvers proof={proof} />}
          />
          <Column
            id="for-exchanges"
            name="For receiving platforms"
            points={[
              'The XRP Ledger itself refuses agents without a credential.',
              'The Travel Rule details arrive before each payment.',
              'Decision records download for your own goAML reporting.',
            ]}
            extra={
              <p className="text-sm font-medium text-secondary">
                310 licensed providers in South Africa must know who sent every transfer.
                <Ref notes={LANDING_NOTES} sources={[SOURCES.fscaLicences]} />
              </p>
            }
          />
        </div>
        <Examples />
        <GoToMarket />
      </div>
    </Section>
  );
}
