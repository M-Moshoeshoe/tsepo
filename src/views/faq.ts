/**
 * The FAQ, in one place: the FAQ page shows every question, and the landing
 * page previews the ones marked `preview`. Each answer is a list of complete
 * sentences, with an optional link at the end.
 */
export interface FaqEntry {
  question: string;
  answer: string[];
  link?: { label: string; href: string };
  preview?: boolean;
}

export const FAQ: FaqEntry[] = [
  {
    question: 'Where do I start?',
    answer: ['Take the 3-minute tour. It runs four stories live on the XRP Ledger Testnet and shows you the proof of each one.'],
    link: { label: 'Take the 3-minute tour', href: '/business?tour' },
  },
  {
    question: 'What is Tšepo?',
    answer: [
      'Tšepo gives a business’s AI agent a verified identity and spending rules it cannot break.',
      'The rules are recorded on the XRP Ledger as a credential. An independent approval service signs each payment only within them, and exchanges accept payments only from verified agents.',
    ],
    preview: true,
  },
  {
    question: 'Who decides whether a payment goes through?',
    answer: [
      'The AI never decides. Thuso, the agent’s AI, only reads the instruction and explains what happened.',
      'The approval service checks each payment against the spending rules and adds the second signature only when the payment is within them. The XRP Ledger requires both signatures, and the exchange’s deposit address accepts only agents with a valid credential.',
    ],
    preview: true,
  },
  {
    question: 'Does real money move?',
    answer: [
      'No. Everything runs on the XRP Ledger Testnet with test RLUSD, which has no value.',
      'The businesses and people, such as Lesedi Design Studio, Naledi Mokoena and Thabo Nkosi, are samples. The payments and credentials are real Testnet transactions that you can open on the explorer.',
    ],
    preview: true,
  },
  {
    question: 'Why is there no sign-in?',
    answer: [
      'This is an open Testnet sandbox, so anyone can explore. In production, each business and exchange has its own verified organisation account.',
    ],
    preview: true,
  },
  {
    question: 'Can the agent raise its own limits or pay someone new?',
    answer: [
      'No. Only the business key can sign new spending rules, and the agent’s key alone cannot pay.',
      'Text such as “ignore your rules” is treated as data, never as an instruction. A payment to a recipient who is not approved is refused.',
    ],
  },
  {
    question: 'What happens when I revoke the agent?',
    answer: [
      'Your business key deletes the agent’s credential from the ledger. Within seconds, the approval service refuses every payment the agent asks for, and the exchange rejects it.',
    ],
  },
  {
    question: 'What is the Travel Rule, and why does it matter here?',
    answer: [
      'FIC Directive 9 has applied since 30 April 2025. It requires South African crypto asset service providers to collect sender and receiver details for every crypto transfer, from R0.',
      'Tšepo sends those details to the exchange before each payment, so the exchange knows who the agent works for.',
    ],
  },
  {
    question: 'What goes on the ledger?',
    answer: [
      'Only fingerprints and references that reveal nothing on their own. The credential holds a fingerprint of the spending rules, and each payment carries a reference to its Travel Rule details.',
      'No personal data goes on the ledger.',
    ],
  },
  {
    question: 'Why do live steps need an access code?',
    answer: [
      'Live steps move test funds in a workspace that every visitor shares, so the code keeps use fair. You can browse every screen without it.',
    ],
  },
  {
    question: 'Why can a sample day show more than the daily limit?',
    answer: [
      'The tour starts each story from a fresh daily total, so one sample day can add up to more than the limit. Within each total, the approval service never let a payment pass the limit.',
    ],
  },
  {
    question: 'What will it cost?',
    answer: [
      'The pilot prices are still to be validated. Businesses pay R450 per active agent a month.',
      'Exchanges pay R1.50 per verified agent deposit, and integration is free during the pilot.',
    ],
  },
];
