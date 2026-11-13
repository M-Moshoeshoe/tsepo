import { SOURCES, type Source } from './sources.ts';

/** The FAQ. Each answer is a list of complete sentences, with an optional link at the end and the source of any outside figure. */
/** The topics the FAQ is grouped under, in the order the page shows them. */
export const FAQ_TOPICS = [
  { id: 'basics', title: 'The basics' },
  { id: 'control', title: 'Control and safety' },
  { id: 'rules', title: 'The Travel Rule and the ledger' },
  { id: 'trying', title: 'Trying Tšepo' },
  { id: 'pilot', title: 'The pilot' },
] as const;

export type FaqTopic = (typeof FAQ_TOPICS)[number]['id'];

export interface FaqEntry {
  topic: FaqTopic;
  question: string;
  answer: string[];
  link?: { label: string; href: string };
  source?: Source;
}

export const FAQ: FaqEntry[] = [
  {
    topic: 'basics',
    question: 'Where do I start?',
    answer: ['Take the 3-minute tour. It runs four stories live on the XRP Ledger Testnet and shows you the proof of each one.'],
    link: { label: 'Take the 3-minute tour', href: '/business?tour' },
  },
  {
    topic: 'basics',
    question: 'What is Tšepo?',
    answer: [
      'Tšepo gives a business’s AI agent a verified identity and spending rules it cannot break.',
      'The rules are recorded on the XRP Ledger as a credential. An independent approval service signs each payment only within them, and the receiving platform, the crypto platform where the recipient receives the money, accepts payments only from verified agents.',
    ],
  },
  {
    topic: 'basics',
    question: 'What is a receiving platform?',
    answer: [
      'The crypto platform where the recipient receives the money, such as VALR or Luno. In the sample, it is where Naledi Mokoena receives her payment, and it accepts payments only from verified agents.',
      'VALR and Luno are examples only. Tšepo has no partnership with either.',
    ],
  },
  {
    topic: 'basics',
    question: 'Why crypto?',
    answer: [
      'AI agents already pay in digital dollars, called stablecoins: Keyrock counted about $73 million across about 176 million agent transactions from May 2025 to April 2026.',
      'On the XRP Ledger, the agent’s identity is a public credential that any platform can check, and the ledger itself refuses a payment without both required signatures. So an unknown agent is refused without any server of ours.',
      'Payments settle in RLUSD, a stablecoin designed to keep a steady value against the US dollar.',
    ],
    source: SOURCES.keyrock,
  },
  {
    topic: 'control',
    question: 'Who decides whether a payment goes through?',
    answer: [
      'The AI never decides. Thuso, the agent’s AI, only reads the instruction and explains what happened.',
      'The approval service checks each payment against the spending rules and adds the second signature only when the payment is within them. The XRP Ledger requires both signatures, and the receiving platform’s deposit address accepts only agents with a valid credential.',
    ],
  },
  {
    topic: 'basics',
    question: 'Does real money move?',
    answer: [
      'No. Everything runs on the XRP Ledger Testnet with test RLUSD, which has no value.',
      'The businesses and people, such as Lesedi Design Studio, Naledi Mokoena and Thabo Nkosi, are samples. The payments and credentials are real Testnet transactions that you can open on the explorer.',
    ],
  },
  {
    topic: 'trying',
    question: 'Why is there no sign-in?',
    answer: [
      'This is an open Testnet sandbox, so anyone can explore. In production, each business and receiving platform has its own verified organisation account.',
    ],
  },
  {
    topic: 'control',
    question: 'Can the agent raise its own limits or pay someone new?',
    answer: [
      'No. Only the business key can sign new spending rules, and the agent’s key alone cannot pay.',
      'Text such as “ignore your rules” is treated as data, never as an instruction. A payment to a recipient who is not approved is refused.',
    ],
  },
  {
    topic: 'control',
    question: 'What happens when I revoke the agent?',
    answer: [
      'Your business key deletes the agent’s credential from the ledger. From the next ledger, within seconds, the approval service refuses every payment the agent asks for, and the receiving platform rejects it.',
    ],
  },
  {
    topic: 'control',
    question: 'Who holds the business key?',
    answer: [
      'In this demo, the app plays the business, so it holds the business key: the recovery key, with weight 2. The agent key alone can never pay.',
      'In a real pilot, the business holds its own key and the app never sees it.',
    ],
  },
  {
    topic: 'rules',
    question: 'What is the Travel Rule, and why does it matter here?',
    answer: [
      'FIC Directive 9 has applied since 30 April 2025. It requires South African crypto asset service providers to collect sender and receiver details for every crypto transfer, from R0.',
      'Tšepo sends those details to the receiving platform before each payment, so it knows who the agent works for.',
    ],
  },
  {
    topic: 'rules',
    question: 'What goes on the ledger?',
    answer: [
      'Only fingerprints and references that reveal nothing on their own. The credential holds a fingerprint of the spending rules, and each payment carries a reference to its Travel Rule details.',
      'No personal data goes on the ledger.',
    ],
  },
  {
    topic: 'trying',
    question: 'Why do live steps need an access code?',
    answer: [
      'Live steps move test funds in a workspace that every visitor shares, so the code keeps use fair. You can browse every screen without it.',
    ],
  },
  {
    topic: 'trying',
    question: 'Why can a sample day show more than the daily limit?',
    answer: [
      'The tour starts each story from a fresh daily total, so one sample day can add up to more than the limit. Within each total, the approval service never let a payment pass the limit.',
    ],
  },
  {
    topic: 'pilot',
    question: 'What will it cost?',
    answer: [
      'Pilot pricing, to be validated: 0.25% of each payment, charged to each side: the business whose agent sends it, and the platform that receives it. Minimum R0.50 and maximum R25 per side, per payment. No monthly fees.',
      'So a R50 payment costs each side R0.50, the minimum; a R2,000 payment costs each side R5; and a R50,000 payment costs each side R25, the cap.',
    ],
  },
];
