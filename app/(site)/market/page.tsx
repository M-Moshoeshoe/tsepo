import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Ref, SourceList } from '../../../components/site/footnotes.tsx';
import { Examples, PRICING_LINE } from '../../../components/site/landing/audiences.tsx';
import { LandingStylePage } from '../../../components/site/page-hero.tsx';
import { Section } from '../../../components/site/section.tsx';
import { formatRand, formatRandMillions, monthlyFees } from '../../../src/domain/pricing.ts';
import { MARKET_NOTES, SOURCES } from '../../../src/views/sources.ts';
import { pilotRequestCount } from '../../_data/pilot.ts';

export const metadata: Metadata = {
  title: 'The market - Tšepo',
  description: 'Who needs Tšepo in South Africa, how it earns, who it works with, and what comes next.',
};

// The pilot count comes from the stored requests. The page is rebuilt at most once a minute.
export const revalidate = 60;

/** The illustration, worked out by the pricing rules: 1,000 agent payments a month, averaging R2,000. */
const ILLUSTRATION = { payments: 1_000, averageCents: 200_000 };

const ROADMAP: { stage: string; text: string }[] = [
  { stage: 'Now', text: 'A Testnet pilot with three businesses and one receiving platform.' },
  { stage: 'Next', text: 'Business verification through CIPC records before Tšepo issues a credential.' },
  { stage: 'Then', text: 'The business key on the business’s own device, so the app never holds it.' },
  { stage: 'After that', text: 'A supervised pilot on the XRP Ledger mainnet.' },
];

/** A card in the landing page's style: a large figure or label, then one or two plain sentences. */
function Card({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <li className="grid content-start gap-2 rounded-2xl bg-secondary p-5">
      <p className="text-display-xs font-medium text-primary tabular-nums">{head}</p>
      <div className="text-sm text-secondary">{children}</div>
    </li>
  );
}

/** The business case: the market, the model, the landscape, the roadmap and the pilot so far. */
export default async function MarketPage() {
  const requests = await pilotRequestCount();
  const month = monthlyFees(ILLUSTRATION.payments, ILLUSTRATION.averageCents);
  return (
    <LandingStylePage
      title="The market."
      lead={
        <p>
          AI agents are starting to send money.
          <Ref notes={MARKET_NOTES} sources={[SOURCES.keyrock]} /> In South Africa, the crypto platform where the recipient receives it,
          such as VALR or Luno, must know who sent each transfer.
        </p>
      }
    >
      <Section id="who-must-know" title="Who must know the sender.">
        <ul className="grid gap-3 md:grid-cols-3">
          <Card
            head={
              <>
                310
                <Ref notes={MARKET_NOTES} sources={[SOURCES.fscaLicences]} />
              </>
            }
          >
            Crypto asset service provider licences the FSCA had approved as at 31 March 2026, from 533 applications.
          </Card>
          <Card
            head={
              <>
                From R0
                <Ref notes={MARKET_NOTES} sources={[SOURCES.directive9]} />
              </>
            }
          >
            Every licensed provider is an accountable institution, so FIC Directive 9 applies: since 30 April 2025 it must collect sender and
            receiver details for every crypto transfer.
          </Card>
          <Card head="81 and 35">
            The same FSCA update reports 81 investigations into unlicensed providers, and plans 35 anti-money-laundering inspections in
            2026/27.
          </Card>
        </ul>
      </Section>

      <Section id="how-tsepo-earns" title="How Tšepo earns." intro={PRICING_LINE}>
        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <Examples />
          <div className="grid content-start gap-2 rounded-2xl bg-secondary p-5">
            <p className="text-sm font-semibold text-primary">Illustration, not a forecast</p>
            <p className="text-md text-secondary">
              A business that sends {ILLUSTRATION.payments.toLocaleString('en-US')} agent payments a month, averaging{' '}
              {formatRand(ILLUSTRATION.averageCents)}, moves {formatRandMillions(month.volumeCents)}. At 0.25% per side, that is{' '}
              {formatRand(month.perSideCents)} from the business and {formatRand(month.perSideCents)} from the receiving platforms,{' '}
              {formatRand(month.totalCents)} a month in total.
            </p>
          </div>
        </div>
      </Section>

      <Section id="who-we-work-with" title="Who we work with.">
        <ul className="grid gap-3 md:grid-cols-2">
          <Card head="Travel Rule providers">
            Providers such as Notabene and Sumsub already move sender and receiver details between crypto platforms. Tšepo adds what they do
            not see: proof on the ledger that a paying agent is registered, who it works for and what it may pay. We see them as partners,
            not rivals, and have no partnership with either yet.
          </Card>
          <Card head="Agent spending tools">
            Tools that limit what an agent may spend help the business. Tšepo works alongside them and adds the part the receiver needs: an
            identity it can check before it accepts the money.
          </Card>
        </ul>
      </Section>

      <Section id="what-comes-next" title="What comes next.">
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {ROADMAP.map((item) => (
            <Card key={item.stage} head={item.stage}>
              {item.text}
            </Card>
          ))}
        </ol>
        {requests > 0 && (
          <p className="text-lg font-medium text-primary">
            {requests} {requests === 1 ? 'person' : 'people'} asked to join the pilot.
          </p>
        )}
      </Section>

      <SourceList notes={MARKET_NOTES} />
    </LandingStylePage>
  );
}
