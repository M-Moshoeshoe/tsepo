import type { Metadata } from 'next';
import { INLINE_LINK, PagePart, SitePage } from '../../../components/site/site-page.tsx';
import { pilotRequestCount } from '../../_data/pilot.ts';

export const metadata: Metadata = {
  title: 'The market - Tšepo',
  description: 'Who needs Tšepo in South Africa, how it earns, who it works with, and what comes next.',
};

// The pilot count comes from the stored requests. The page is rebuilt at most once a minute.
export const revalidate = 60;

/** The FSCA's update on crypto asset service provider licensing, of 15 April 2026, as republished by FA News. */
const FSCA_UPDATE =
  'https://www.fanews.co.za/article/compliance-regulatory/2/financial-sector-conduct-authority-fsca-was-fsb/1059/update-on-licensing-and-supervision-of-crypto-asset-service-providers/43764';

const ROADMAP: { stage: string; text: string }[] = [
  { stage: 'Now', text: 'A Testnet pilot with three businesses and one exchange.' },
  { stage: 'Next', text: 'Business verification through CIPC records before Tšepo issues a credential.' },
  { stage: 'Then', text: 'The business key on the business’s own device, so the app never holds it.' },
  { stage: 'After that', text: 'A supervised pilot on the XRP Ledger mainnet.' },
];

/** The business case: the market, the model, the landscape, the roadmap and the pilot so far. */
export default async function MarketPage() {
  const requests = await pilotRequestCount();
  return (
    <SitePage
      title="The market."
      lead={<p>AI agents are starting to send money. In South Africa, the crypto platform where the recipient receives it, such as VALR or Luno, must know who sent each transfer.</p>}
    >
      <PagePart title="Who must know the sender">
        <p>
          As at 31 March 2026, the FSCA had approved 310 crypto asset service provider licences, from 533 applications.
        </p>
        <p>
          Every licensed provider is an accountable institution, so FIC Directive 9 applies to it: since 30 April 2025 it must collect
          sender and receiver details for every crypto transfer, from R0.
        </p>
        <p>
          With most applications decided, the FSCA reports 81 investigations into unlicensed providers and plans 35 anti-money-laundering
          inspections in 2026/27. Source:{' '}
          <a href={FSCA_UPDATE} target="_blank" rel="noreferrer" className={INLINE_LINK}>
            the FSCA update of 15 April 2026<span className="sr-only"> (opens in a new tab)</span>
          </a>
          .
        </p>
      </PagePart>

      <PagePart title="How Tšepo earns">
        <p>Pilot pricing, to be validated with the first customers:</p>
        <ul className="grid list-disc gap-2 pl-6">
          <li>A business pays R450 a month for each active agent.</li>
          <li>An exchange pays R1.50 for each verified agent deposit, with free integration during the pilot.</li>
        </ul>
        <div className="grid gap-2 rounded-xl bg-secondary p-5 text-md">
          <p className="text-sm font-semibold text-primary">Illustration, not a forecast</p>
          <p>
            An exchange that receives 10,000 verified agent deposits in a month would pay R15,000 for that month. Twenty businesses that
            run two agents each would pay R18,000 a month between them.
          </p>
        </div>
      </PagePart>

      <PagePart title="Who we work with">
        <p>
          Travel Rule providers such as Notabene and Sumsub already move sender and receiver details between exchanges. Tšepo adds what
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
    </SitePage>
  );
}
