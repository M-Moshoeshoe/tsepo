import { Check } from '@untitledui/icons';
import type { ReactNode } from 'react';
import { Button } from '@/components/base/buttons/button';
import type { ProofFile } from '../../../src/views/proof.ts';
import { Section, UiCard } from '../section.tsx';

interface Audience {
  id: string;
  name: string;
  who: string;
  price: string;
  priceNote: string;
  gets: string[];
  action: { label: string; href: string };
}

const AUDIENCES: Audience[] = [
  {
    id: 'for-businesses',
    name: 'For businesses',
    who: 'You pay contractors, suppliers or payouts through an AI agent.',
    price: 'R450',
    priceNote: 'per active agent a month',
    gets: [
      'The agent cannot change its limits per payment and per day.',
      'The agent pays only the recipients you approve.',
      'One action stops the agent within seconds.',
      'Every payment keeps its instruction, decision and ledger record.',
    ],
    action: { label: 'Explore the business workspace', href: '/business' },
  },
  {
    id: 'for-exchanges',
    name: 'For exchanges',
    who: 'You are a crypto asset service provider, and AI agents pay into your accounts.',
    price: 'R1.50',
    priceNote: 'per verified agent deposit, with free integration during the pilot',
    gets: [
      'The XRP Ledger itself protects your agent deposit address.',
      'The Travel Rule details arrive before each payment.',
      'You can check any agent’s credential by its address.',
      'Each decision is recorded and ready for your reports.',
    ],
    action: { label: 'See how to integrate', href: '/exchange/integrate' },
  },
];

/** The first integration step, shortened from the Integrate page. */
const INTEGRATE_PREVIEW = `await client.submitAndWait({
  TransactionType: 'DepositPreauth',
  Account: depositAddress,
  AuthorizeCredentials: [{ Credential: {
    Issuer: TSEPO_ISSUER,
    CredentialType: convertStringToHex('AGENT_MANDATE'),
  } }],
}, { wallet, autofill: true });`;

function Plan({ audience, extra }: { audience: Audience; extra?: ReactNode }) {
  return (
    <article id={audience.id} aria-labelledby={`${audience.id}-name`} className="grid scroll-mt-4 content-start gap-6 rounded-2xl p-6 ring-1 ring-secondary md:p-8">
      <div className="grid gap-2">
        <h3 id={`${audience.id}-name`} className="text-display-xs font-medium text-primary">
          {audience.name}
        </h3>
        <p className="text-md text-tertiary">{audience.who}</p>
      </div>
      <div className="grid gap-1 border-y border-secondary py-4">
        <p className="text-xs font-semibold text-tertiary">Pilot pricing, to be validated</p>
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-mono text-display-xs font-medium text-primary">{audience.price}</span>
          <span className="text-sm text-tertiary">{audience.priceNote}</span>
        </p>
      </div>
      <ul className="grid gap-2.5">
        {audience.gets.map((line) => (
          <li key={line} className="flex items-start gap-2.5 text-md text-secondary">
            <Check className="mt-0.5 size-5 shrink-0 text-fg-brand-primary" aria-hidden />
            {line}
          </li>
        ))}
      </ul>
      {extra}
      <Button href={audience.action.href} color="secondary" size="lg" className="justify-self-start">
        {audience.action.label}
      </Button>
    </article>
  );
}

/** Who must approve each payment, read from the agent account's signer list on the ledger. */
function ApproversFragment({ proof }: { proof: ProofFile }) {
  const { quorum, weights } = proof.signerList;
  return (
    <UiCard label="Who must approve each payment" className="bg-secondary shadow-none ring-0">
      <p className="text-sm font-semibold text-primary">Who must approve each payment</p>
      <dl className="grid gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-tertiary">Agent key and approval service</dt>
          <dd className="font-mono text-xs text-primary">
            {weights.agent} + {weights.approvalService} = {quorum}
          </dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-secondary pt-2">
          <dt className="text-tertiary">Business key alone</dt>
          <dd className="font-mono text-xs text-primary">{weights.business}</dd>
        </div>
        <div className="flex justify-between gap-4 border-t border-secondary pt-2">
          <dt className="text-tertiary">Agent key alone</dt>
          <dd className="font-mono text-xs text-primary">
            {weights.agent} of {quorum}, refused
          </dd>
        </div>
      </dl>
    </UiCard>
  );
}

/** Businesses and exchanges side by side: who each is, what they get, and the pilot price. */
export function Audiences({ proof }: { proof: ProofFile }) {
  const [business, exchange] = AUDIENCES;
  return (
    <Section id="pricing" title="Built for both sides of the payment." intro="The business that pays and the exchange that receives each get what they need.">
      <div className="grid gap-6 lg:grid-cols-2">
        {business !== undefined && <Plan audience={business} extra={<ApproversFragment proof={proof} />} />}
        {exchange !== undefined && (
          <Plan
            audience={exchange}
            extra={
              <pre
                role="region"
                aria-label="The first integration step, in xrpl.js"
                tabIndex={0}
                className="overflow-x-auto rounded-lg bg-primary-solid p-4 text-xs leading-relaxed text-white outline-focus-ring focus-visible:outline-2"
              >
                <code className="font-mono">{INTEGRATE_PREVIEW}</code>
              </pre>
            }
          />
        )}
      </div>
    </Section>
  );
}
