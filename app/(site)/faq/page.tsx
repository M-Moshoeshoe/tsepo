import type { Metadata } from 'next';
import Link from 'next/link';
import { SourceLinks } from '../../../components/site/source-links.tsx';
import { INLINE_LINK, SitePage } from '../../../components/site/site-page.tsx';
import { FAQ } from '../../../src/views/faq.ts';

export const metadata: Metadata = {
  title: 'FAQ - Tšepo',
  description: 'Plain answers about Tšepo: who decides payments, what goes on the ledger, revocation, the Travel Rule and pilot pricing.',
};

/** Plain answers to the questions visitors ask most. */
export default function FaqPage() {
  return (
    <SitePage
      title="Frequently asked questions."
      lead={
        <p>
          These answers cover who decides, what goes on the ledger and what the pilot costs. If your question is missing,{' '}
          <Link href="/contact" className={INLINE_LINK}>
            ask us
          </Link>
          .
        </p>
      }
    >
      <dl className="grid">
        {FAQ.map((entry) => (
          <div key={entry.question} className="grid gap-3 border-t border-secondary py-8 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16">
            <dt className="text-xl font-medium text-primary">{entry.question}</dt>
            <dd className="grid max-w-2xl gap-3 text-lg text-tertiary">
              {entry.answer.map((sentence) => (
                <p key={sentence}>{sentence}</p>
              ))}
              {entry.link !== undefined && (
                <p>
                  <Link href={entry.link.href} className={INLINE_LINK}>
                    {entry.link.label}
                  </Link>
                </p>
              )}
              {entry.source !== undefined && <SourceLinks sources={[entry.source]} className="text-sm text-tertiary" />}
            </dd>
          </div>
        ))}
      </dl>
    </SitePage>
  );
}
