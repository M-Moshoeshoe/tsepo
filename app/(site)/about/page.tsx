import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SiteFooter, SiteHeader } from '../../../components/site/site-chrome.tsx';

export const metadata: Metadata = {
  title: 'About - Tšepo',
  description: 'What Tšepo means, why it exists, how it was built, and who built it.',
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-secondary pt-6">
      <h2 className="text-lg font-semibold text-primary">{title}</h2>
      <div className="grid gap-3 text-md text-tertiary">{children}</div>
    </section>
  );
}

/** About Tšepo: the name, the reason, the build and the credits. */
export default function AboutPage() {
  return (
    <div className="min-h-dvh bg-primary">
      <SiteHeader />
      <main id="main" className="mx-auto grid max-w-3xl gap-8 px-4 pt-10 pb-20 lg:px-8">
        <h1 className="text-display-sm font-semibold text-primary">About Tšepo</h1>

        <Section title="What the name means">
          <p>
            Tšepo is a Sesotho word for hope and trust. It is the trust a business places in an agent that pays on its behalf, and the
            trust an exchange needs before it accepts that agent&apos;s money.
          </p>
        </Section>

        <Section title="Why it exists">
          <p>
            AI agents can now hold a wallet and pay, but they carry no identity. A business that gives an agent a key gives it the whole
            account, with no limit and no off switch. In South Africa, FIC Directive 9 requires crypto asset service providers to know who
            sends every transfer, from R0, so an exchange cannot accept a payment from an agent it cannot identify.
          </p>
          <p>
            Tšepo gives the agent a verified identity and spending rules it cannot break, recorded on the XRP Ledger. An independent
            approval service signs each payment only within the rules, the business can revoke the agent at any time, and the exchange
            accepts payments only from verified agents, with the Travel Rule details in hand first.
          </p>
        </Section>

        <Section title="How it was built">
          <p>
            The rules are XRP Ledger features, not promises: credentials for identity, credential-based Deposit Authorization for the
            exchange, a two-key signer list so the agent never pays alone, RLUSD for payments, and a source tag on every agent payment.
            Everything runs on the XRP Ledger Testnet.
          </p>
          <p>
            The agent reads plain-language instructions with Claude, from Anthropic. The AI only reads; every decision is made by tested
            rules in code. The product is written in strict TypeScript with Next.js and xrpl.js, with Zod checks at every boundary and
            the business rules covered by unit and end-to-end tests. The source is on GitHub.
          </p>
        </Section>

        <Section title="Who built it">
          <p>Built by Mokhachane Moshoeshoe, software engineer, for the Node Engine Hackathon 2026.</p>
        </Section>

        <Section title="Credits">
          <p className="text-sm">
            Interface components from Untitled UI React (MIT licence), built on React Aria (Apache 2.0 licence). Icons from Untitled UI
            (MIT licence). The IBM Plex Sans and IBM Plex Mono typefaces (SIL Open Font Licence). The copied interface files and the
            changes made to them are listed in the repository.
          </p>
        </Section>
      </main>
      <SiteFooter />
    </div>
  );
}
