/**
 * Every outside source the public pages cite, in one place, so a claim and
 * its source never drift apart. Each one was read before it was cited, and
 * the comment beside it records what it supports.
 */
export interface Source {
  title: string;
  publisher: string;
  date: string;
  href: string;
}

export const SOURCES = {
  /** Freysa, an AI agent guarding a prize pool, was talked into sending the whole pool, about $47,000, in November 2024. */
  freysa: {
    title: 'Crypto user convinces AI bot Freysa to transfer $47K prize pool',
    publisher: 'Cointelegraph',
    date: '29 November 2024',
    href: 'https://cointelegraph.com/news/crypto-user-convinced-ai-bot-transfer-47k',
  },
  /** An attacker broke into AIXBT's dashboard and queued prompts that sent 55.5 ETH, about $106,200, on 18 March 2025. */
  aixbt: {
    title: 'Hacker breaks into AI crypto bot aixbt’s dashboard to snatch 55 ETH',
    publisher: 'Cointelegraph',
    date: '19 March 2025',
    href: 'https://cointelegraph.com/news/hacker-breaches-ai-crypto-bot-aixbt-steals-55-eth',
  },
  /** A hidden prompt made Grok instruct Bankrbot to send tokens worth $150,000 to $200,000, in May 2026. */
  grokIncident: {
    title: 'AI Prompt Injection Exploit Drains Grok-Linked Crypto Wallet',
    publisher: 'OECD AI incident monitor',
    date: 'May 2026',
    href: 'https://oecd.ai/en/incidents/2026-05-04-4a73',
  },
  /** The same Grok and Bankrbot incident: the attacker returned the funds five minutes later. */
  grokReturned: {
    title: 'MetaMask Crypto Security Report: May 2026',
    publisher: 'MetaMask',
    date: '2 June 2026',
    href: 'https://metamask.com/news/crypto-security-report-may-2026',
  },
  /** 23% of US consumers trust generative AI to handle payments for them; 61% would trust Visa to handle agentic transactions. */
  visaTrust: {
    title: 'New Visa Research Finds Consumer Trust is Accelerating the Path to Agentic Commerce',
    publisher: 'Visa',
    date: '9 September 2026',
    href: 'https://investor.visa.com/news/news-details/2026/New-Visa-Research-Finds-Consumer-Trust-is-Accelerating-the-Path-to-Agentic-Commerce/default.aspx',
  },
  /** FIC Directive 9: the travel rule for crypto asset transfers, with no minimum amount. */
  directive9: {
    title: 'Directive 9: Travel rule relating to crypto asset transfers',
    publisher: 'Financial Intelligence Centre',
    date: 'November 2024',
    href: 'https://www.fic.gov.za/wp-content/uploads/2024/11/Directive-9-Travel-rule-relating-to-crypto-asset-transfers.pdf',
  },
  /** Keyrock: AI agents settled about $73 million across about 176 million transactions from May 2025 to April 2026, more than 98% in USDC. */
  keyrock: {
    title: 'AI Agent Economy Sees $73M Settled Through Stablecoin Payments',
    publisher: 'Cointelegraph, reporting Keyrock',
    date: '25 May 2026',
    href: 'https://cointelegraph.com/news/ai-agents-using-stablecoins-as-default-settlement-layer-keyrock',
  },
  /** The FSCA had approved 310 crypto asset service provider licences as at 31 March 2026, from 533 applications. */
  fscaLicences: {
    title: 'Update on licensing and supervision of crypto asset service providers',
    publisher: 'FSCA, republished by FA News',
    date: '15 April 2026',
    href: 'https://www.fanews.co.za/article/compliance-regulatory/2/financial-sector-conduct-authority-fsca-was-fsb/1059/update-on-licensing-and-supervision-of-crypto-asset-service-providers/43764',
  },
} as const satisfies Record<string, Source>;

/** "Visa, 9 September 2026": how a source is named in running text. */
export function sourceLabel(source: Source): string {
  return `${source.publisher}, ${source.date}`;
}

/** The landing page's sources, in the order they first appear, so footnote numbers run 1, 2, 3 down the page. */
export const LANDING_NOTES: readonly Source[] = [
  SOURCES.freysa,
  SOURCES.aixbt,
  SOURCES.grokIncident,
  SOURCES.grokReturned,
  SOURCES.visaTrust,
  SOURCES.directive9,
  SOURCES.keyrock,
  SOURCES.fscaLicences,
];

/** The market page's sources, in order of appearance. */
export const MARKET_NOTES: readonly Source[] = [SOURCES.keyrock, SOURCES.fscaLicences, SOURCES.directive9];

/** The About page's sources, in order of appearance. */
export const ABOUT_NOTES: readonly Source[] = [SOURCES.directive9];

/** A source's footnote number on a page. Throws when the page does not list it, so a footnote can never point nowhere. */
export function noteNumber(notes: readonly Source[], source: Source): number {
  const index = notes.indexOf(source);
  if (index === -1) throw new Error(`The page does not list the source "${source.title}"`);
  return index + 1;
}
