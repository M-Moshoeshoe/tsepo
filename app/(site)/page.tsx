import type { Metadata } from 'next';
import { Audiences } from '../../components/site/landing/audiences.tsx';
import { CfoQuestions } from '../../components/site/landing/cfo-questions.tsx';
import { FaqPreview, InkBand, TryToBreakIt } from '../../components/site/landing/closing.tsx';
import { Hero } from '../../components/site/landing/hero.tsx';
import { HowItWorks } from '../../components/site/landing/how-it-works.tsx';
import { MeetThuso } from '../../components/site/landing/meet-thuso.tsx';
import { Numbers } from '../../components/site/landing/numbers.tsx';
import { Proven } from '../../components/site/landing/proven.tsx';
import { Stakes } from '../../components/site/landing/stakes.tsx';
import { SiteFooter, SiteHeader } from '../../components/site/site-chrome.tsx';
import { loadLandingData } from '../_data/landing.ts';

export const metadata: Metadata = {
  title: 'Tšepo: spending rules your AI agent cannot break',
  description:
    'Tšepo records each AI agent’s identity and spending rules on the XRP Ledger, so its payments stay limited, stoppable and accepted.',
};

// The figures come from the stored records. The page is rebuilt at most once a minute, so it stays fast.
export const revalidate = 60;

/** The public front page: what Tšepo is, why it matters, why it is different, and the proof. */
export default async function LandingPage() {
  const { proof, numbers, thuso } = await loadLandingData();
  return (
    <div className="min-h-dvh bg-primary">
      <SiteHeader />
      <main id="main">
        <Hero proof={proof} numbers={numbers} />
        <Stakes />
        <Numbers numbers={numbers} />
        <HowItWorks proof={proof} />
        <MeetThuso example={thuso} />
        <CfoQuestions />
        <Audiences proof={proof} />
        <Proven proof={proof} />
        <TryToBreakIt />
        <FaqPreview />
        <InkBand />
      </main>
      <SiteFooter />
    </div>
  );
}
