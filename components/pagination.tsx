'use client';

import { ArrowLeft, ArrowRight } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';

/**
 * Previous and next, with the range shown, in the Untitled UI card footer
 * style. The page lives in the address, so it can be shared and survives a refresh.
 */
export function Pagination({ label, previousHref, nextHref }: { label: string; previousHref: string | undefined; nextHref: string | undefined }) {
  return (
    <nav aria-label="Pages" className="flex items-center justify-between gap-3 border-t border-secondary px-4 py-3 lg:px-5">
      <Button href={previousHref ?? '#'} isDisabled={previousHref === undefined} color="secondary" size="sm" iconLeading={ArrowLeft} routerOptions={{ scroll: false }}>
        Previous
      </Button>
      <p className="text-sm text-secondary tabular-nums" aria-live="polite">
        {label}
      </p>
      <Button href={nextHref ?? '#'} isDisabled={nextHref === undefined} color="secondary" size="sm" iconTrailing={ArrowRight} routerOptions={{ scroll: false }}>
        Next
      </Button>
    </nav>
  );
}
