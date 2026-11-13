import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { SITE_WIDTH } from './site-chrome.tsx';

/**
 * One section of a public page: a hairline rule, a medium-weight title with
 * an optional sentence beside it, then the content. Sections separate by a
 * rule and space, not by boxes or labels.
 */
export function Section({
  id,
  title,
  intro,
  children,
  className,
  statement = false,
}: {
  id: string;
  title: ReactNode;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
  /** A two-sentence statement as the title: set smaller and across the full width. */
  statement?: boolean;
}) {
  const headingId = `${id}-title`;
  return (
    <section id={id} aria-labelledby={headingId} className="scroll-mt-4">
      <div className={cx(SITE_WIDTH, 'grid gap-10 py-10 md:gap-12 md:py-12', className)}>
        <div className={cx('grid gap-4 border-t border-secondary pt-8', !statement && 'lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-16')}>
          <h2 id={headingId} className={cx('font-medium text-primary', statement ? 'max-w-5xl text-display-xs md:text-display-sm' : 'text-display-xs md:text-display-md')}>
            {title}
          </h2>
          {intro !== undefined && <p className="text-lg text-tertiary">{intro}</p>}
        </div>
        {children}
      </div>
    </section>
  );
}

/** A soft tinted panel that holds a fragment of the real interface. */
export function FragmentPanel({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('grid content-center rounded-2xl bg-secondary p-5 md:p-8', className)}>{children}</div>;
}

/** A white card in the product's own style, for a fragment of the interface. */
export function UiCard({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return (
    <div aria-label={label} role={label === undefined ? undefined : 'group'} className={cx('grid gap-3 rounded-xl bg-primary p-4 shadow-xs ring-1 ring-secondary', className)}>
      {children}
    </div>
  );
}
