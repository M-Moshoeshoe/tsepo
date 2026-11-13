import { ArrowRight } from '@untitledui/icons';
import Link from 'next/link';
import { Button } from '@/components/base/buttons/button';
import { FAQ } from '../../../src/views/faq.ts';
import { JoinPilot } from '../join-pilot.tsx';
import { SITE_WIDTH } from '../site-chrome.tsx';
import { Section, TEXT_LINK } from '../section.tsx';
import { LandingActions } from './hero.tsx';

/** One short band that sends the visitor to try to break the rules. */
export function TryToBreakIt() {
  return (
    <section id="try" aria-labelledby="try-title" className="scroll-mt-4">
      <div className={`${SITE_WIDTH} py-10 md:py-12`}>
        <div className="grid gap-6 rounded-2xl bg-secondary p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-10">
          <div className="grid gap-2">
            <h2 id="try-title" className="text-display-xs font-medium text-primary">
              Try to break it.
            </h2>
            <p className="text-lg text-tertiary">Tell the agent to pay someone new, to pay too much or to ignore its rules. Then watch the rules stop it.</p>
          </div>
          <Button href="/business/instruct" color="primary" size="xl" className="justify-self-start">
            Give an instruction
          </Button>
        </div>
      </div>
    </section>
  );
}

/** A preview of the FAQ, with a link to every answer. */
export function FaqPreview() {
  const preview = FAQ.filter((entry) => entry.preview === true);
  return (
    <Section id="faq-preview" title="Questions, answered.">
      <dl className="grid gap-x-12 gap-y-8 md:grid-cols-2">
        {preview.map((entry) => (
          <div key={entry.question} className="grid content-start gap-2">
            <dt className="text-lg font-semibold text-primary">{entry.question}</dt>
            <dd className="grid gap-2 text-md text-tertiary">
              {entry.answer.map((sentence) => (
                <p key={sentence}>{sentence}</p>
              ))}
            </dd>
          </div>
        ))}
      </dl>
      <Link href="/faq" className={TEXT_LINK}>
        Read every answer
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </Section>
  );
}

/** The one dark band: the final call to action, with both ways in and the pilot. */
export function InkBand() {
  return (
    <section aria-labelledby="cta-title" className="bg-primary-solid">
      <div className={`${SITE_WIDTH} grid gap-8 py-20 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:py-24`}>
        <div className="grid max-w-2xl gap-4">
          <h2 id="cta-title" className="text-display-sm font-medium text-white md:text-display-md">
            See every check work, live, in three minutes.
          </h2>
          <p className="text-lg text-white">
            The tour runs four real stories on the XRP Ledger Testnet. To use Tšepo for real, join the pilot.
          </p>
        </div>
        <div className="grid gap-3 sm:flex sm:flex-wrap">
          <LandingActions onDark />
          <JoinPilot />
        </div>
      </div>
    </section>
  );
}
