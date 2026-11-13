'use client';

import { ArrowLeft, ArrowRight, PauseCircle, PlayCircle } from '@untitledui/icons';
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cx } from '@/utils/cx';
import { SiteButton } from '../site-button.tsx';

/** How long each step stays highlighted. */
const STEP_MS = 3200;

/**
 * The steps, all visible at once from 640px: a 2x2 grid on a tablet and a
 * row on a desktop. There they are highlighted one at a time, in the order a
 * payment runs, with a button to pause; with reduced motion the highlight
 * never starts, and it never hides a step. Below 640px they become a sliding
 * row that only moves when the visitor moves it: each slide snaps into place,
 * the arrows move one slide at a time, and a visitor can also swipe.
 */
export function StepCarousel({ label, labels, children }: { label: string; labels: string[]; children: ReactNode }) {
  const slides = Children.toArray(children);
  const track = useRef<HTMLOListElement>(null);
  const [index, setIndex] = useState(0);
  const [active, setActive] = useState<number | undefined>(undefined);
  const [playing, setPlaying] = useState(false);
  const [canPlay, setCanPlay] = useState(false);

  useEffect(() => {
    const allowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches && window.matchMedia('(min-width: 640px)').matches;
    setCanPlay(allowed);
    setPlaying(allowed);
    if (allowed) setActive(0);
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setActive((current) => ((current ?? -1) + 1) % slides.length);
    }, STEP_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [playing, slides.length]);

  const update = useCallback(() => {
    const element = track.current;
    const first = element?.firstElementChild;
    if (element === null || !(first instanceof HTMLElement)) return;
    const step = first.offsetWidth + parseFloat(getComputedStyle(element).columnGap || '0');
    const atEnd = element.scrollLeft + element.clientWidth >= element.scrollWidth - 2;
    setIndex(atEnd ? slides.length - 1 : Math.round(element.scrollLeft / step));
  }, [slides.length]);

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
    const slide = element?.children[target];
    if (element === null || !(slide instanceof HTMLElement)) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    element.scrollTo({ left: slide.offsetLeft - element.offsetLeft, behavior: smooth ? 'smooth' : 'auto' });
  };

  return (
    <div className="grid gap-5">
      <div className="flex items-center justify-between gap-4 sm:hidden">
        <p className="font-mono text-xs text-tertiary" aria-live="polite">
          Step {index + 1} of {slides.length}
        </p>
        <div className="flex gap-2">
          <SiteButton variant="quiet" size="md" icon={ArrowLeft} iconLabel="Previous step" onClick={() => { go(index - 1); }} disabled={index === 0} />
          <SiteButton variant="quiet" size="md" icon={ArrowRight} iconLabel="Next step" onClick={() => { go(index + 1); }} disabled={index >= slides.length - 1} />
        </div>
      </div>
      <ol
        ref={track}
        tabIndex={0}
        aria-label={label}
        className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto rounded-2xl p-1 outline-focus-ring focus-visible:outline-2 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4"
      >
        {slides.map((slide, position) => (
          <li
            key={position}
            className={cx(
              'w-[85%] shrink-0 snap-start rounded-2xl transition-[box-shadow,transform] duration-500 sm:w-auto',
              active === position && '-translate-y-0.5 shadow-lg ring-2 ring-brand',
            )}
          >
            {slide}
          </li>
        ))}
      </ol>
      {canPlay && (
        <div className="hidden items-center justify-between gap-3 sm:flex">
          <p className="text-xs text-tertiary" aria-hidden>
            {active === undefined ? '' : `${String(active + 1)} of ${String(slides.length)}: ${labels[active] ?? ''}`}
          </p>
          <SiteButton
            variant="quiet"
            size="sm"
            arrow={false}
            icon={playing ? PauseCircle : PlayCircle}
            onClick={() => {
              setPlaying((current) => !current);
            }}
          >
            {playing ? 'Pause the steps' : 'Play the steps'}
          </SiteButton>
        </div>
      )}
    </div>
  );
}
