import { Check } from '@untitledui/icons';
import type { ReactNode } from 'react';
import { DEMO_LIMITS, DEMO_PAYEES } from '../../../src/config/demo.ts';
import { shortHash, type ProofFile } from '../../../src/views/proof.ts';
import { StatusBadge } from '../../display.tsx';
import { FragmentPanel, Section, UiCard } from '../section.tsx';

function Tick() {
  return (
    <span aria-hidden className="flex size-4 shrink-0 items-center justify-center rounded-full bg-success-solid text-white">
      <Check className="size-3" />
    </span>
  );
}

function Row({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-secondary pt-2.5 text-sm first:border-t-0 first:pt-0">
      <dt className="text-tertiary">{term}</dt>
      <dd className="text-right text-primary">{children}</dd>
    </div>
  );
}

function Mono({ children }: { children: ReactNode }) {
  return <span className="font-mono text-xs">{children}</span>;
}

/** Step 1: the spending rules card, as the Spending rules page shows it. */
function RulesFragment() {
  return (
    <UiCard label="Spending rules">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-primary">Spending rules</p>
        <StatusBadge tone="cleared">Signed by the business</StatusBadge>
      </div>
      <dl className="grid gap-2.5">
        <Row term="Per payment">
          <Mono>{DEMO_LIMITS.perPaymentLimit} RLUSD</Mono>
        </Row>
        <Row term="Per day">
          <Mono>{DEMO_LIMITS.dailyLimit} RLUSD</Mono>
        </Row>
        <Row term="Approved recipients">{DEMO_PAYEES.map((payee) => payee.name).join(', ')}</Row>
        <Row term="Valid until">31 December 2027</Row>
      </dl>
    </UiCard>
  );
}

/** Step 2: the credential on the ledger. */
function CredentialFragment({ proof }: { proof: ProofFile }) {
  const issued = proof.ledger['credential-issued'];
  return (
    <UiCard label="The agent credential">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-primary">Agent credential</p>
        <StatusBadge tone="cleared">Accepted</StatusBadge>
      </div>
      <dl className="grid gap-2.5">
        <Row term="Type">
          <Mono>AGENT_MANDATE</Mono>
        </Row>
        <Row term="Holds">A fingerprint of the rules</Row>
        <Row term="Personal data">None</Row>
        <Row term="Ledger">
          <Mono>
            {issued.result} · {issued.ledgerIndex}
          </Mono>
        </Row>
      </dl>
    </UiCard>
  );
}

/** Step 3: the two signatures every payment needs. */
function SignaturesFragment({ proof }: { proof: ProofFile }) {
  const { quorum, weights } = proof.signerList;
  return (
    <UiCard label="The signatures on a payment">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-primary">Signatures</p>
        <Mono>
          {weights.agent + weights.approvalService} of {quorum}
        </Mono>
      </div>
      <ul className="grid gap-2.5 text-sm">
        <li className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-primary">
            <Tick />
            Agent key
          </span>
          <Mono>weight {weights.agent}</Mono>
        </li>
        <li className="flex items-center justify-between gap-3 border-t border-secondary pt-2.5">
          <span className="flex items-center gap-2 text-primary">
            <Tick />
            Approval service
          </span>
          <Mono>weight {weights.approvalService}</Mono>
        </li>
      </ul>
      <p className="border-t border-secondary pt-2.5 font-mono text-xs text-primary">
        {proof.ledger['approved-payment'].result} · {shortHash(proof.transactions['approved-payment'])}
      </p>
    </UiCard>
  );
}

/** Step 4: the exchange's view of an incoming agent payment. */
function ExchangeFragment() {
  return (
    <UiCard label="An incoming payment at the exchange">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-primary">2 RLUSD from Lesedi payout agent</p>
        <StatusBadge tone="cleared">Cleared</StatusBadge>
      </div>
      <ol className="grid gap-2.5 text-sm">
        <li className="flex items-center gap-2 text-primary">
          <Tick />
          Travel Rule details received
        </li>
        <li className="flex items-center gap-2 border-t border-secondary pt-2.5 text-primary">
          <Tick />
          Credential checked on the ledger
        </li>
        <li className="flex items-center gap-2 border-t border-secondary pt-2.5 text-primary">
          <Tick />
          Payment received and matched
        </li>
      </ol>
    </UiCard>
  );
}

/** Four steps, each shown with a fragment of the real interface. */
export function HowItWorks({ proof }: { proof: ProofFile }) {
  const steps: { title: string; text: string; fragment: ReactNode }[] = [
    {
      title: '1. The business sets the spending rules.',
      text: 'It chooses who the agent may pay, how much per payment and per day, and until when.',
      fragment: <RulesFragment />,
    },
    {
      title: '2. Tšepo records them on the XRP Ledger.',
      text: 'The agent holds a credential that carries a fingerprint of its rules, and anyone can check it.',
      fragment: <CredentialFragment proof={proof} />,
    },
    {
      title: '3. Every payment needs two signatures.',
      text: 'The approval service adds the second signature only when the payment is within the rules.',
      fragment: <SignaturesFragment proof={proof} />,
    },
    {
      title: '4. The exchange accepts verified agents.',
      text: 'The Travel Rule details arrive first, and the ledger accepts the payment only from a credentialed agent.',
      fragment: <ExchangeFragment />,
    },
  ];
  return (
    <Section id="how-it-works" title="How it works." intro="Each step is enforced by the XRP Ledger or by tested rules in code, never by a promise.">
      <ol className="grid gap-x-8 gap-y-12 md:grid-cols-2">
        {steps.map((step) => (
          <li key={step.title} className="grid content-start gap-5">
            <FragmentPanel className="min-h-64">
              <div className="mx-auto w-full max-w-sm">{step.fragment}</div>
            </FragmentPanel>
            <div className="grid gap-1.5">
              <h3 className="text-lg font-semibold text-primary">{step.title}</h3>
              <p className="text-md text-tertiary">{step.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
