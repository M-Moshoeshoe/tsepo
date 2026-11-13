import { ArrowRight } from '@untitledui/icons';
import type { Metadata } from 'next';
import Link from 'next/link';
import { SitePage } from '../../../components/site/site-page.tsx';
import { EXPLORE_AS } from '../../../src/views/navigation.ts';

export const metadata: Metadata = {
  title: 'Open the product - Tšepo',
  description: 'Explore Tšepo as Lesedi Design Studio or as the Receiving platform. No sign-up is needed.',
};

/** The workspace chooser. There is no sign-in on the Testnet sandbox, so the visitor picks who to explore as. */
export default function ExplorePage() {
  return (
    <SitePage
      title="Open the product."
      lead={<p>Explore as Lesedi Design Studio (finance lead) or the Receiving platform (compliance officer), the crypto platform where the recipient receives the money. No sign-up is needed.</p>}
    >
      <ul className="grid gap-6 md:grid-cols-2">
        {EXPLORE_AS.map((choice) => (
          <li key={choice.href}>
            <Link
              href={choice.href}
              className="group grid h-full content-start gap-3 rounded-2xl bg-primary p-6 shadow-md ring-1 ring-secondary outline-focus-ring transition-shadow duration-150 hover:bg-secondary hover:shadow-lg focus-visible:outline-2 motion-reduce:transition-none md:p-8"
            >
              <span className="text-xs font-semibold text-tertiary">{choice.role}</span>
              <span className="text-display-xs font-medium text-primary">{choice.name}</span>
              <span className="text-md text-tertiary">{choice.line}</span>
              <span className="mt-2 inline-flex items-center gap-1 text-md font-semibold text-brand-secondary group-hover:text-brand-secondary_hover">
                {choice.label}
                <ArrowRight className="size-4" aria-hidden />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </SitePage>
  );
}
