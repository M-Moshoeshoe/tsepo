import { CheckVerified01, CoinsHand, FileCheck02, LinkExternal01, Sliders01 } from '@untitledui/icons';
import type { Metadata } from 'next';
import Link from 'next/link';
import type { FC, ReactNode } from 'react';
import { Button } from '@/components/base/buttons/button';
import { JoinPilot } from '../../components/site/join-pilot.tsx';
import { SiteFooter, SiteHeader } from '../../components/site/site-chrome.tsx';
import { LANDING_ACTIONS } from '../../src/views/navigation.ts';
import { explorerUrl, loadProof, PROOF_KEYS, PROOF_LINES } from '../../src/views/proof.ts';
import { formatSastDate } from '../../src/views/status.ts';

export const metadata: Metadata = {
  title: 'Tšepo: spending rules your AI agent cannot break',
  description:
    'Tšepo gives a business’s AI agent a verified identity and spending rules it cannot break, so the business stays in control and exchanges know who is paying.',
};

const [tour, product] = LANDING_ACTIONS;

const STEPS: { icon: FC<{ className?: string }>; title: string; text: string }[] = [
  { icon: Sliders01, title: 'Register', text: 'The business sets its agent’s spending rules: who it may pay, how much per payment and per day, and until when.' },
  { icon: FileCheck02, title: 'Record', text: 'Tšepo records the rules on the XRP Ledger as a credential the agent holds. Only a fingerprint goes on the ledger.' },
  { icon: CoinsHand, title: 'Pay', text: 'The agent pays in RLUSD. An independent approval service adds the second signature only within the rules.' },
  { icon: CheckVerified01, title: 'Receive', text: 'The exchange accepts payments only from verified agents, and the Travel Rule details arrive first.' },
];

const QUESTIONS: { question: string; answer: string; proof: { label: string; href: string } }[] = [
  {
    question: 'What may the agent do?',
    answer: 'Only what its spending rules allow: a limit per payment, a limit per day, and an expiry. The agent cannot change them.',
    proof: { label: 'See the spending rules', href: '/business/rules' },
  },
  {
    question: 'Who can it pay?',
    answer: 'Only the approved recipients named in the signed rules. A payment to anyone else is refused before it is sent.',
    proof: { label: 'See the approved recipients', href: '/business/rules' },
  },
  {
    question: 'How do I stop it?',
    answer: 'Revoke it. Its credential is deleted from the ledger, and from the next ledger, within seconds, its payments are refused.',
    proof: { label: 'Watch a revocation, live', href: '/business?tour=4' },
  },
  {
    question: 'How do I prove what it did and why?',
    answer: 'Every payment keeps its instruction, the decision with its reasons, the Travel Rule details and the ledger record, ready to download.',
    proof: { label: 'See the payments and their evidence', href: '/business/payments' },
  },
];

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="mx-auto grid max-w-6xl gap-8 px-4 py-16 lg:px-8">
      <div className="grid max-w-3xl gap-3">
        <h2 id={id} className="text-display-xs font-semibold text-primary">
          {title}
        </h2>
        {intro !== undefined && <p className="text-lg text-tertiary">{intro}</p>}
      </div>
      {children}
    </section>
  );
}

function PilotPrice({ price }: { price: string }) {
  return (
    <div className="grid gap-1 rounded-lg bg-primary p-4 ring-1 ring-secondary ring-inset">
      <p className="text-xs font-semibold text-brand-secondary">Pilot pricing, to be validated</p>
      <p className="text-md font-semibold text-primary">{price}</p>
    </div>
  );
}

/** The public front page: what Tšepo is, the problem, how it works, who it is for, and the proof on the ledger. */
export default function LandingPage() {
  const proof = loadProof();
  return (
    <div className="min-h-dvh bg-primary">
      <SiteHeader />
      <main id="main">
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-16 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:px-8 lg:pt-20">
          <div className="grid gap-6">
            <h1 className="text-display-md font-semibold text-primary lg:text-display-lg">Spending rules your AI agent cannot break.</h1>
            <p className="text-lg text-tertiary">
              Tšepo gives a business’s AI agent a verified identity and spending rules it cannot break, so the business stays in control
              and exchanges know who is paying.
            </p>
            <div className="flex flex-wrap gap-3">
              {tour !== undefined && (
                <Button href={tour.href} color="primary" size="xl">
                  {tour.label}
                </Button>
              )}
              {product !== undefined && (
                <Button href={product.href} color="secondary" size="xl">
                  {product.label}
                </Button>
              )}
            </div>
            <p className="text-sm text-tertiary">Runs live on the XRP Ledger Testnet. No real money moves.</p>
          </div>
          {/* A real screenshot of the Business Overview, captured from the running product. */}
          <img
            src="/screenshots/business-overview.webp"
            alt="The Business Overview in Tšepo: the payout agent, what it may still spend today, its recent payments, and its spending over the last 14 days."
            width={1440}
            height={900}
            className="h-auto w-full rounded-xl shadow-xl ring-1 ring-secondary"
          />
        </section>

        <div className="bg-secondary">
          <Section id="problem" title="The problem">
            <ul className="grid gap-4 text-lg text-secondary md:grid-cols-3">
              <li className="rounded-xl bg-primary p-5 ring-1 ring-secondary ring-inset">AI agents can now hold a wallet and pay, but they carry no identity.</li>
              <li className="rounded-xl bg-primary p-5 ring-1 ring-secondary ring-inset">
                A business that gives its agent a key gives it the whole account, with no limit and no off switch.
              </li>
              <li className="rounded-xl bg-primary p-5 ring-1 ring-secondary ring-inset">
                Since 30 April 2025, FIC Directive 9 requires South African exchanges to know who sends every crypto transfer, from R0. An
                agent nobody can identify cannot be paid in.
              </li>
            </ul>
          </Section>
        </div>

        <Section id="how" title="How it works" intro="Four steps, each enforced by the XRP Ledger, not by promises.">
          <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="grid content-start gap-3">
                  <span className="flex size-12 items-center justify-center rounded-xl bg-brand-primary ring-1 ring-brand ring-inset" aria-hidden>
                    <Icon className="size-6 text-fg-brand-primary" />
                  </span>
                  <h3 className="text-md font-semibold text-primary">
                    <span className="text-brand-secondary tabular-nums">{index + 1}.</span> {step.title}
                  </h3>
                  <p className="text-md text-tertiary">{step.text}</p>
                </li>
              );
            })}
          </ol>
          <p className="text-md text-secondary">The business can revoke the agent at any time. From the next ledger, within seconds, it cannot pay.</p>
        </Section>

        <div className="bg-secondary">
          <Section id="questions" title="The four questions a finance lead asks" intro="Each answer links to its proof in the product.">
            <div className="grid gap-4 md:grid-cols-2">
              {QUESTIONS.map((item) => (
                <div key={item.question} className="grid content-start gap-2 rounded-xl bg-primary p-6 ring-1 ring-secondary ring-inset">
                  <h3 className="text-lg font-semibold text-primary">{item.question}</h3>
                  <p className="text-md text-tertiary">{item.answer}</p>
                  <Link href={item.proof.href} className="justify-self-start rounded-sm text-md font-semibold text-brand-secondary outline-focus-ring hover:text-brand-secondary_hover focus-visible:outline-2">
                    {item.proof.label}
                  </Link>
                </div>
              ))}
            </div>
          </Section>
        </div>

        <Section id="who" title="Who it is for">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid content-start gap-4 rounded-xl p-6 ring-1 ring-secondary ring-inset">
              <h3 className="text-xl font-semibold text-primary">For businesses</h3>
              <p className="text-md text-tertiary">
                Businesses that pay contractors, suppliers or payouts through an AI agent. You get limits the agent cannot change,
                approved recipients only, an off switch that works within seconds, and evidence for every payment.
              </p>
              <PilotPrice price="R450 per active agent a month" />
              <Button href="/business" color="secondary" size="md" className="justify-self-start">
                Open the business workspace
              </Button>
            </div>
            <div className="grid content-start gap-4 rounded-xl p-6 ring-1 ring-secondary ring-inset">
              <h3 className="text-xl font-semibold text-primary">For exchanges</h3>
              <p className="text-md text-tertiary">
                Crypto asset service providers licensed by the FSCA. You get a deposit address the ledger itself protects, Travel Rule
                details before each payment, and decision records ready for your reports.
              </p>
              <PilotPrice price="R1.50 per verified agent deposit. Integration free during the pilot." />
              <Button href="/exchange/integrate" color="secondary" size="md" className="justify-self-start">
                See how to integrate
              </Button>
            </div>
          </div>
        </Section>

        <div className="bg-secondary">
          <Section
            id="proof"
            title="Proven on Testnet"
            intro={`Each feature below is a real transaction on the XRP Ledger Testnet, captured on ${formatSastDate(proof.capturedAt)}. Open any of them on the explorer.`}
          >
            <ul className="grid gap-3 md:grid-cols-2">
              {PROOF_KEYS.map((key) => (
                <li key={key} className="grid content-start gap-1 rounded-xl bg-primary p-5 ring-1 ring-secondary ring-inset">
                  <h3 className="text-md font-semibold text-primary">{PROOF_LINES[key].title}</h3>
                  <p className="text-sm text-tertiary">{PROOF_LINES[key].line}</p>
                  <a
                    href={explorerUrl(proof.transactions[key])}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 justify-self-start rounded-sm text-sm font-semibold text-brand-secondary outline-focus-ring hover:text-brand-secondary_hover focus-visible:outline-2"
                  >
                    View on the XRP Ledger
                    <LinkExternal01 className="size-3.5" aria-hidden />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                </li>
              ))}
            </ul>
          </Section>
        </div>

        <section aria-labelledby="cta" className="mx-auto grid max-w-3xl justify-items-center gap-5 px-4 py-20 text-center lg:px-8">
          <h2 id="cta" className="text-display-xs font-semibold text-primary">
            Walk through it in four live steps.
          </h2>
          <p className="text-lg text-tertiary">Three minutes, on the XRP Ledger Testnet, with the proof of each step.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {tour !== undefined && (
              <Button href={tour.href} color="primary" size="xl">
                {tour.label}
              </Button>
            )}
            <JoinPilot />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
