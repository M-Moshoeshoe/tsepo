import type { Metadata } from 'next';
import { PRICING_LINE } from '../../../components/site/landing/audiences.tsx';
import { Ref, SourceList } from '../../../components/site/footnotes.tsx';
import { PagePart, SitePage } from '../../../components/site/site-page.tsx';
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

/** The business case: the market, the model, the landscape, the roadmap and the pilot so far. */
export default async function MarketPage() {
  const requests = await pilotRequestCount();
  const month = monthlyFees(ILLUSTRATION.payments, ILLUSTRATION.averageCents);
  return (
    <SitePage
      title="The market."
      lead={
        <p>
          AI agents are starting to send money.
          <Ref notes={MARKET_NOTES} sources={[SOURCES.keyrock]} /> In South Africa, the crypto platform where the recipient receives it,
          such as VALR or Luno, must know who sent each transfer.
        </p>
      }
    >
      <PagePart title="Who must know the sender">
        <p>
          As at 31 March 2026, the FSCA had approved 310 crypto asset service provider licences, from 533 applications.
          <Ref notes={MARKET_NOTES} sources={[SOURCES.fscaLicences]} />
        </p>
        <p>
          Every licensed provider is an accountable institution, so FIC Directive 9 applies to it: since 30 April 2025 it must collect
          sender and receiver details for every crypto transfer, from R0.
          <Ref notes={MARKET_NOTES} sources={[SOURCES.directive9]} />
        </p>
        <p>
          With most applications decided, the FSCA reports 81 investigations into unlicensed providers and plans 35 anti-money-laundering
          inspections in 2026/27.
          <Ref notes={MARKET_NOTES} sources={[SOURCES.fscaLicences]} />
        </p>
      </PagePart>

      <PagePart title="How Tšepo earns">
        <p>{PRICING_LINE}</p>
        <p className="text-md">Shaped by feedback from mentors at W3Node 2026.</p>
        <div className="grid gap-2 rounded-xl bg-secondary p-5 text-md">
          <p className="text-sm font-semibold text-primary">Illustration, not a forecast</p>
          <p>
            A business that sends {ILLUSTRATION.payments.toLocaleString('en-US')} agent payments a month, averaging{' '}
            {formatRand(ILLUSTRATION.averageCents)}, moves {formatRandMillions(month.volumeCents)}. At 0.25% per side,
            that is {formatRand(month.perSideCents)} from the business and {formatRand(month.perSideCents)} from the receiving platforms,{' '}
            {formatRand(month.totalCents)} a month in total.
          </p>
        </div>
      </PagePart>

      <PagePart title="Who we work with">
        <p>
          Travel Rule providers such as Notabene and Sumsub already move sender and receiver details between crypto platforms. Tšepo adds what
          they do not see: proof on the ledger that a paying agent is registered, who it works for and what it may pay. We see them as
          partners, not rivals. We have no partnership with either yet.
        </p>
        <p>
          Tools that limit what an agent may spend help the business. Tšepo works alongside them and adds the part the receiver needs:
          an identity it can check before it accepts the money.
        </p>
      </PagePart>

      <PagePart title="What comes next">
        <ol className="grid gap-3">
          {ROADMAP.map((item) => (
            <li key={item.stage} className="grid gap-0.5">
              <span className="text-md font-semibold text-primary">{item.stage}</span>
              <span>{item.text}</span>
            </li>
          ))}
        </ol>
      </PagePart>

      {requests > 0 && (
        <PagePart title="The pilot so far">
          <p className="text-primary">
            {requests} {requests === 1 ? 'person' : 'people'} asked to join the pilot.
          </p>
        </PagePart>
      )}

      <SourceList notes={MARKET_NOTES} inPage />
    </SitePage>
  );
}
