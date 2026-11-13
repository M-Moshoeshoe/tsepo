'use client';

import { ArrowLeft, ArrowRight } from '@untitledui/icons';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { SiteButton } from './site-button.tsx';

/**
 * Below 640px, a row the visitor swipes: each item snaps into place, two
 * arrows move one item at a time, and a counter says where they are. From
 * 640px it is the caller's own grid, with nothing to swipe. It never moves
 * by itself, and smooth scrolling switches off for reduced motion.
 *
 * The children are the items themselves, so a list or a set of figures
 * keeps its own markup.
 */
export function SwipeRow({ label, count, gridClass, children }: { label: string; count: number; gridClass: string; children: ReactNode }) {
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);

  const update = useCallback(() => {
    const element = track.current;
    const first = element?.firstElementChild;
    if (element === null || !(first instanceof HTMLElement)) return;
    const step = first.offsetWidth + parseFloat(getComputedStyle(element).columnGap || '0');
    const atEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - 2;
    setIndex(atEnd ? count - 1 : Math.round(element.scrollLeft / step));
  }, [count]);

  useEffect(() => {
    const element = track.current;
    if (element === null) return undefined;
    update();
    element.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      element.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [update]);

  const go = (target: number): void => {
    const element = track.current;
    const item = element?.children[target];
    if (element === null || !(item instanceof HTMLElement)) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollTo({ left: item.offsetLeft - element.offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
  };

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between gap-4 sm:hidden">
        <p className="font-mono text-xs text-tertiary" aria-live="polite">
          {index + 1} of {count}
        </p>
        <div className="flex gap-2">
          <SiteButton variant="quiet" size="md" icon={ArrowLeft} iconLabel="Previous" onClick={() => { go(index - 1); }} disabled={index === 0} />
          <SiteButton variant="quiet" size="md" icon={ArrowRight} iconLabel="Next" onClick={() => { go(index + 1); }} disabled={index >= count - 1} />
        </div>
      </div>
      <div
        ref={track}
        role="region"
        aria-label={label}
        tabIndex={0}
        className={cx(
          'scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto p-1 outline-focus-ring focus-visible:outline-2',
          '[&>*]:w-[85%] [&>*]:shrink-0 [&>*]:snap-start',
          'sm:mx-0 sm:overflow-visible sm:p-0 sm:[&>*]:w-auto',
          gridClass,
        )}
      >
        {children}
      </div>
    </div>
  );
}
