import type { Metadata } from 'next';
import { ContactForm } from '../../../components/site/contact-form.tsx';
import { SiteFooter, SiteHeader } from '../../../components/site/site-chrome.tsx';
import { REPOSITORY } from '../../../src/views/navigation.ts';

export const metadata: Metadata = {
  title: 'Contact - Tšepo',
  description: 'Send a message about Tšepo, the pilot or an integration.',
};

/** A short way to reach the people behind Tšepo. */
export default function ContactPage() {
  return (
    <div className="min-h-dvh bg-primary">
      <SiteHeader />
      <main id="main" className="mx-auto grid max-w-2xl gap-6 px-4 pt-10 pb-20 lg:px-8">
        <h1 className="text-display-sm font-semibold text-primary">Contact</h1>
        <p className="text-md text-tertiary">
          A question about Tšepo, the pilot or an integration? Send a message and we will reply by email. Your details stay with us
          and are never shared. You can also open an issue on{' '}
          <a href={REPOSITORY} target="_blank" rel="noreferrer" className="font-semibold text-brand-secondary hover:text-brand-secondary_hover">
            GitHub<span className="sr-only"> (opens in a new tab)</span>
          </a>
          .
        </p>
        <ContactForm />
      </main>
      <SiteFooter />
    </div>
  );
}
