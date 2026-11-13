import type { Metadata } from 'next';
import { Audiences } from '../../components/site/landing/audiences.tsx';
import { InkBand } from '../../components/site/landing/closing.tsx';
import { Hero } from '../../components/site/landing/hero.tsx';
import { HowItWorks } from '../../components/site/landing/how-it-works.tsx';
import { MeetThuso } from '../../components/site/landing/meet-thuso.tsx';
import { Proof } from '../../components/site/landing/proof.tsx';
import { Stakes } from '../../components/site/landing/stakes.tsx';
import { SiteFooter, SiteHeader } from '../../components/site/site-chrome.tsx';
import { integrationCode } from '../_data/integration.ts';
import { loadLandingData } from '../_data/landing.ts';

export const metadata: Metadata = {
  title: 'Tšepo: spending rules your AI agent cannot break',
  description:
    'Tšepo records each AI agent’s identity and spending rules on the XRP Ledger, so its payments stay limited, stoppable and accepted.',
};

// The figures come from the stored records. The page is rebuilt at most once a minute, so it stays fast.
export const revalidate = 60;

/** The public front page in seven sections: the hero, the stakes, how it works, the proof, Thuso, who it is for, and the closing band. */
export default async function LandingPage() {
  const { proof, numbers, thuso } = await loadLandingData();
  return (
    <div className="min-h-dvh bg-primary">
      <SiteHeader />
      <main id="main">
        <Hero />
        <Stakes />
        <HowItWorks proof={proof} />
        <Proof numbers={numbers} proof={proof} />
        <MeetThuso example={thuso} />
        <Audiences proof={proof} integrationPreview={integrationCode()['step-1']} />
        <InkBand />
      </main>
      <SiteFooter />
    </div>
  );
}
