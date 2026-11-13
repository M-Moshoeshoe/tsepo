import type { Metadata } from 'next';
import { ChevronDown } from '@untitledui/icons';
import { LandingStylePage } from '../../../components/site/page-hero.tsx';
import { Section } from '../../../components/site/section.tsx';
import { SiteButton } from '../../../components/site/site-button.tsx';
import { SITE_WIDTH } from '../../../components/site/site-chrome.tsx';
import { SourceLinks } from '../../../components/site/source-links.tsx';
import { FAQ, FAQ_TOPICS } from '../../../src/views/faq.ts';

export const metadata: Metadata = {
  title: 'FAQ - Tšepo',
  description: 'Plain answers about Tšepo: what it is, who decides a payment, what goes on the ledger, revocation, the Travel Rule and the pilot.',
};

/**
 * The FAQ as one accordion, grouped by topic in landing-page sections. The
 * answers share one name, so opening one closes the others, with no script;
 * each answer is real text in the page, so search and screen readers find it.
 */
export default function FaqPage() {
  return (
    <LandingStylePage
      title="Frequently asked questions."
      lead={<p>Plain answers about what Tšepo is, who decides each payment, what goes on the ledger and what the pilot costs.</p>}
    >
      {FAQ_TOPICS.map((topic) => (
        <Section key={topic.id} id={topic.id} title={topic.title} className="gap-5 py-5 md:gap-6 md:py-6">
          <div className="grid divide-y divide-secondary border-y border-secondary">
            {FAQ.filter((entry) => entry.topic === topic.id).map((entry) => (
              <details key={entry.question} name="faq" className="group">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 rounded-sm py-4 text-lg font-medium text-primary outline-focus-ring focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
                  {entry.question}
                  <ChevronDown
                    aria-hidden
                    className="mt-1 size-5 shrink-0 text-fg-quaternary transition-transform duration-150 group-open:rotate-180 motion-reduce:transition-none"
                  />
                </summary>
                <div className="grid max-w-3xl gap-3 pb-5 text-md text-tertiary">
                  {entry.answer.map((sentence) => (
                    <p key={sentence}>{sentence}</p>
                  ))}
                  {entry.link !== undefined && (
                    <SiteButton href={entry.link.href} variant="quiet" size="md" className="justify-self-start">
                      {entry.link.label}
                    </SiteButton>
                  )}
                  {entry.source !== undefined && <SourceLinks sources={[entry.source]} className="text-sm text-tertiary" />}
                </div>
              </details>
            ))}
          </div>
        </Section>
      ))}
      <div className={`${SITE_WIDTH} pb-16`}>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-secondary pt-8 text-lg text-primary">
          Still have a question?
          <SiteButton href="/contact" variant="quiet" size="lg">
            Contact us
          </SiteButton>
        </p>
      </div>
    </LandingStylePage>
  );
}
