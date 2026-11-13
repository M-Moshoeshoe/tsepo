import type { Metadata } from 'next';
import Link from 'next/link';
import { ContactForm } from '../../../components/site/contact-form.tsx';
import { INLINE_LINK, SitePage } from '../../../components/site/site-page.tsx';
import { REPOSITORY } from '../../../src/views/navigation.ts';

export const metadata: Metadata = {
  title: 'Contact - Tšepo',
  description: 'Send a message about Tšepo, the pilot or an integration.',
};

const TOPICS: { title: string; text: string }[] = [
  { title: 'The pilot', text: 'You pay through an AI agent, or your exchange receives payments from agents.' },
  { title: 'An integration', text: 'You want your deposit address to accept payments only from verified agents.' },
  { title: 'A question', text: 'Something about the product, the ledger or the Travel Rule is not clear.' },
];

/** A short way to reach the people behind Tšepo. */
export default function ContactPage() {
  return (
    <SitePage title="Talk to us." lead={<p>Send a message about the pilot, an integration or the product. We reply by email, and we never share your details.</p>}>
      <div className="grid gap-12 border-t border-secondary pt-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="grid content-start gap-8">
          <dl className="grid gap-6">
            {TOPICS.map((topic) => (
              <div key={topic.title} className="grid gap-1">
                <dt className="text-lg font-medium text-primary">{topic.title}</dt>
                <dd className="text-md text-tertiary">{topic.text}</dd>
              </div>
            ))}
          </dl>
          <p className="text-md text-tertiary">
            You can also read the{' '}
            <Link href="/faq" className={INLINE_LINK}>
              FAQ
            </Link>{' '}
            or open an issue on{' '}
            <a href={REPOSITORY} target="_blank" rel="noreferrer" className={INLINE_LINK}>
              GitHub<span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </p>
        </div>
        <ContactForm />
      </div>
    </SitePage>
  );
}
