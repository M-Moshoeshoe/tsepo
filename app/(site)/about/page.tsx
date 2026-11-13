import type { Metadata } from 'next';
import { INLINE_LINK, PagePart, SitePage } from '../../../components/site/site-page.tsx';
import { REPOSITORY } from '../../../src/views/navigation.ts';

export const metadata: Metadata = {
  title: 'About - Tšepo',
  description: 'Why Tšepo exists, what it proves on the XRP Ledger, and who built it.',
};

/** About Tšepo: the human story, what it proves on the ledger, and who built it. */
export default function AboutPage() {
  return (
    <SitePage
      title="Why Tšepo exists."
      lead={<p>Tšepo gives a business’s AI agent a verified identity and spending rules it cannot break.</p>}
    >
      <PagePart title="What the names mean">
        <p>
          <span lang="st">Tšepo</span> (say TSEH-poh) means hope, or trust, in Sesotho. It names the trust a business places in an agent
          that pays for it.
        </p>
        <p>
          <span lang="st">Thuso</span> (say TOO-soh) means help in Sesotho and Setswana. Thuso is the agent’s AI, which reads each
          instruction and explains what happened.
        </p>
      </PagePart>

      <PagePart title="The problem we saw">
        <p>AI agents can now hold a wallet and pay. A business that wants to use one faces a hard choice.</p>
        <p>It can give the agent a key, and with it the whole account, with no limit and no way to stop it. Or it can keep paying by hand.</p>
        <p>
          The exchange on the other side faces its own problem. FIC Directive 9 requires it to know who sends every crypto transfer, from
          R0. It cannot accept money from an agent that nobody can identify.
        </p>
      </PagePart>

      <PagePart title="What Tšepo proves on the ledger">
        <p>Tšepo records each agent’s identity and spending rules on the XRP Ledger as a credential that anyone can check.</p>
        <p>
          Every payment needs two signatures, and the approval service signs only within the rules. The exchange’s deposit address
          accepts payments only from agents with a valid credential, and the Travel Rule details arrive before the money.
        </p>
        <p>When the business revokes the agent, its next payment is refused. Each of these steps is a real transaction on Testnet.</p>
      </PagePart>

      <PagePart title="How it was built">
        <p>
          Thuso, the agent’s AI, uses Claude from Anthropic to read plain-language instructions. Tested rules in code make every
          decision.
        </p>
        <p>
          The product is written in strict TypeScript with Next.js and xrpl.js. It checks every input with Zod, and unit and end-to-end
          tests cover it. The source code is on{' '}
          <a href={REPOSITORY} target="_blank" rel="noreferrer" className={INLINE_LINK}>
            GitHub<span className="sr-only"> (opens in a new tab)</span>
          </a>
          .
        </p>
      </PagePart>

      <PagePart title="Who built it">
        <p className="text-primary">Built by Mokhachane Moshoeshoe, software engineer.</p>
        <p>Built for the Node Engine Hackathon 2026, Agentic Finance track, sponsored by Ripple.</p>
      </PagePart>
    </SitePage>
  );
}
