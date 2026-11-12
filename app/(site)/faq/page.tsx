import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteFooter, SiteHeader } from '../../../components/site/site-chrome.tsx';

export const metadata: Metadata = {
  title: 'FAQ - Tšepo',
  description: 'Plain answers about Tšepo: who decides payments, what goes on the ledger, revocation, the Travel Rule and pilot pricing.',
};

const QUESTIONS: { question: string; answer: ReactNode }[] = [
  {
    question: 'What is Tšepo?',
    answer:
      'Tšepo gives a business’s AI agent a verified identity and spending rules it cannot break. The rules are recorded on the XRP Ledger as a credential, an independent approval service signs each payment only within them, and exchanges accept payments only from verified agents.',
  },
  {
    question: 'Does real money move?',
    answer:
      'No. Everything runs on the XRP Ledger Testnet with test RLUSD, which has no value. The businesses and people, such as Lesedi Design Studio, Naledi Mokoena and Thabo Nkosi, are invented. The payments and credentials are real Testnet transactions you can open on the explorer.',
  },
  {
    question: 'Who decides whether a payment goes through?',
    answer:
      'Never the AI. Thuso, the agent’s AI step, only reads the instruction. The approval service checks each payment against the spending rules and adds the second signature only when it is within them. The XRP Ledger requires both signatures, and the exchange’s deposit address accepts only agents with a valid credential.',
  },
  {
    question: 'Can the agent raise its own limits or pay someone new?',
    answer:
      'No. Only the business key can sign new spending rules, and the agent’s key alone cannot pay. Text such as “ignore your rules” is treated as data, never as an instruction, and a payee who is not approved is refused.',
  },
  {
    question: 'What happens when I revoke the agent?',
    answer:
      'The business key deletes the agent’s credential from the ledger. From the next ledger, within seconds, the approval service refuses every payment the agent asks for, and the exchange rejects it.',
  },
  {
    question: 'What is the Travel Rule, and why does it matter here?',
    answer:
      'FIC Directive 9, in force since 30 April 2025, requires South African crypto asset service providers to collect sender and receiver details for every crypto transfer, from R0. Tšepo sends those details to the exchange before each payment, so the exchange knows who the agent works for.',
  },
  {
    question: 'What goes on the ledger?',
    answer:
      'Only fingerprints and opaque references: the credential holds a fingerprint of the spending rules, and each payment carries a reference to its Travel Rule details. No personal data goes on the ledger.',
  },
  {
    question: 'Why do live steps need an access code?',
    answer:
      'Live steps move test funds in a workspace every visitor shares, so the code keeps use fair. Every screen can be browsed without it.',
  },
  {
    question: 'Why can a sample day show more than the daily limit?',
    answer:
      'The guided tour starts each story from a fresh daily total, so one sample day can add up to more than the limit. Within each total, the approval service never let a payment pass the limit.',
  },
  {
    question: 'What will it cost?',
    answer:
      'Pilot pricing, to be validated: R450 per active agent a month for businesses, and R1.50 per verified agent deposit for exchanges, with integration free during the pilot.',
  },
];

/** Plain answers to the questions visitors ask most. */
export default function FaqPage() {
  return (
    <div className="min-h-dvh bg-primary">
      <SiteHeader />
      <main id="main" className="mx-auto grid max-w-3xl gap-8 px-4 pt-10 pb-20 lg:px-8">
        <h1 className="text-display-sm font-semibold text-primary">Frequently asked questions</h1>
        <dl className="grid gap-6">
          {QUESTIONS.map((item) => (
            <div key={item.question} className="grid gap-1.5 border-t border-secondary pt-5">
              <dt className="text-md font-semibold text-primary">{item.question}</dt>
              <dd className="text-md text-tertiary">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </main>
      <SiteFooter />
    </div>
  );
}
