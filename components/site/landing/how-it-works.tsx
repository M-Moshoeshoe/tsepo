import { ArrowRight, Check } from '@untitledui/icons';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { DEMO_LIMITS, DEMO_PAYEES } from '../../../src/config/demo.ts';
import { shortHash, type ProofFile } from '../../../src/views/proof.ts';
import { StatusBadge } from '../../display.tsx';
import { FragmentPanel, Section, UiCard } from '../section.tsx';
import { StepCarousel } from './step-carousel.tsx';

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

/** Step 4: the receiving platform's view of an incoming agent payment. */
function ExchangeFragment() {
  return (
    <UiCard label="An incoming payment at the receiving platform">
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

interface Step {
  title: string;
  question: string;
  answer: string;
  proof: { label: string; href: string };
  fragment: ReactNode;
}

/** Four steps, each shown with a fragment of the real interface, and each answering one of the four questions a CFO asks. */
export function HowItWorks({ proof }: { proof: ProofFile }) {
  const steps: Step[] = [
    {
      title: '1. The business sets the spending rules.',
      question: 'Who can it pay?',
      answer: 'Only the recipients the business approves in its rules, within a limit per payment and a limit per day.',
      proof: { label: 'See the approved recipients', href: '/business/rules' },
      fragment: <RulesFragment />,
    },
    {
      title: '2. Tšepo records them on the XRP Ledger.',
      question: 'How do I stop it?',
      answer: 'Revoke it. Your business key deletes this credential, and from the next ledger its payments are refused.',
      proof: { label: 'Watch a revocation live', href: '/business?tour=4' },
      fragment: <CredentialFragment proof={proof} />,
    },
    {
      title: '3. Every payment needs two signatures.',
      question: 'What may the agent do?',
      answer: 'Only what the approval service will co-sign: payments within the rules. The agent cannot change the rules or pay alone.',
      proof: { label: 'See who must approve each payment', href: '/business/rules' },
      fragment: <SignaturesFragment proof={proof} />,
    },
    {
      title: '4. The receiving platform accepts verified agents.',
      question: 'How do I prove what it did and why?',
      answer: 'Every payment keeps its instruction, its decision, its Travel Rule details and its ledger record.',
      proof: { label: 'See the payments and their evidence', href: '/business/payments' },
      fragment: <ExchangeFragment />,
    },
  ];
  return (
    <Section
      id="how-it-works"
      title="How it works."
      intro="Four steps, each enforced by the XRP Ledger or by tested rules in code. Each one answers a question your CFO will ask."
    >
      <StepCarousel label="How it works, in four steps" labels={steps.map((step) => step.title.replace(/^\d+\.\s*/, ''))}>
        {steps.map((step) => (
          <article key={step.title} className="grid h-full content-start gap-4 rounded-2xl p-2.5 ring-1 ring-secondary">
            <FragmentPanel className="min-h-[15rem] p-2.5 md:p-3">{step.fragment}</FragmentPanel>
            <div className="grid gap-3 px-1.5 pb-2">
              <h3 className="text-md font-semibold text-primary">{step.title}</h3>
              <div className="grid gap-1 border-t border-secondary pt-3">
                <p className="text-sm font-semibold text-secondary">{step.question}</p>
                <p className="text-sm text-tertiary">{step.answer}</p>
              </div>
              <Link href={step.proof.href} className="inline-flex items-center gap-1 justify-self-start rounded-sm text-sm font-semibold text-brand-secondary outline-focus-ring hover:text-brand-secondary_hover focus-visible:outline-2">
                {step.proof.label}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </article>
        ))}
      </StepCarousel>
    </Section>
  );
}
