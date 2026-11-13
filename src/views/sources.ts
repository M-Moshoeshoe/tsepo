/**
 * Every outside source the public pages cite, in one place, so a claim and
 * its source never drift apart. Each one was read before it was cited, and
 * the comment beside it records what it supports.
 */
export interface Source {
  /** How the source is named on the page: the publisher and the date. */
  label: string;
  href: string;
}

export const SOURCES = {
  /** Freysa, an AI agent guarding a prize pool, was talked into sending the whole pool, about $47,000, in November 2024. */
  freysa: { label: 'Cointelegraph, November 2024', href: 'https://cointelegraph.com/news/crypto-user-convinced-ai-bot-transfer-47k' },
  /** An attacker broke into AIXBT's dashboard and queued prompts that sent 55.5 ETH, about $106,200, on 18 March 2025. */
  aixbt: { label: 'Cointelegraph, March 2025', href: 'https://cointelegraph.com/news/hacker-breaches-ai-crypto-bot-aixbt-steals-55-eth' },
  /** A hidden prompt made Grok instruct Bankrbot to send tokens worth $150,000 to $200,000, in May 2026. */
  grokIncident: { label: 'OECD AI incident monitor, May 2026', href: 'https://oecd.ai/en/incidents/2026-05-04-4a73' },
  /** The same Grok and Bankrbot incident: the attacker returned the funds five minutes later. */
  grokReturned: { label: 'MetaMask security report, May 2026', href: 'https://metamask.com/news/crypto-security-report-may-2026' },
  /** 23% of US consumers trust generative AI to handle payments for them; 61% would trust Visa to handle agentic transactions. */
  visaTrust: {
    label: 'Visa Trust Index, 9 September 2026',
    href: 'https://investor.visa.com/news/news-details/2026/New-Visa-Research-Finds-Consumer-Trust-is-Accelerating-the-Path-to-Agentic-Commerce/default.aspx',
  },
  /** FIC Directive 9: the travel rule for crypto asset transfers, with no minimum amount. */
  directive9: {
    label: 'FIC Directive 9',
    href: 'https://www.fic.gov.za/wp-content/uploads/2024/11/Directive-9-Travel-rule-relating-to-crypto-asset-transfers.pdf',
  },
  /** The FSCA had approved 310 crypto asset service provider licences as at 31 March 2026. */
  fscaLicences: {
    label: 'FSCA update, 15 April 2026',
    href: 'https://www.fanews.co.za/article/compliance-regulatory/2/financial-sector-conduct-authority-fsca-was-fsb/1059/update-on-licensing-and-supervision-of-crypto-asset-service-providers/43764',
  },
  /** Keyrock: AI agents settled about $73 million across about 176 million transactions from May 2025 to April 2026, more than 98% in USDC. */
  keyrock: { label: 'Keyrock, reported by Cointelegraph, May 2026', href: 'https://cointelegraph.com/news/ai-agents-using-stablecoins-as-default-settlement-layer-keyrock' },
} as const satisfies Record<string, Source>;
