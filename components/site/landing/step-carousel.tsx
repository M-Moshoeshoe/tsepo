'use client';

import { ArrowLeft, ArrowRight } from '@untitledui/icons';
import { Children, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';

const BUTTON =
  'flex size-9 items-center justify-center rounded-full text-secondary ring-1 ring-secondary outline-focus-ring hover:bg-secondary hover:text-primary focus-visible:outline-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent';

/**
 * A sliding row of steps. Each slide snaps into place; the arrows move one
 * slide at a time, and a visitor can also swipe, scroll or use the keyboard
 * on the row. Smooth sliding switches off for reduced motion. Nothing moves
 * by itself.
 */
export function StepCarousel({ label, children }: { label: string; children: ReactNode }) {
  const slides = Children.toArray(children);
  const track = useRef<HTMLOListElement>(null);
  const [index, setIndex] = useState(0);

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
      <div className="flex items-center justify-between gap-4">
        <p className="font-mono text-xs text-tertiary" aria-live="polite">
          Step {index + 1} of {slides.length}
        </p>
        <div className="flex gap-2">
          <button type="button" className={BUTTON} onClick={() => { go(index - 1); }} disabled={index === 0} aria-label="Previous step">
            <ArrowLeft className="size-4" aria-hidden />
          </button>
          <button type="button" className={BUTTON} onClick={() => { go(index + 1); }} disabled={index >= slides.length - 1} aria-label="Next step">
            <ArrowRight className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      <ol
        ref={track}
        tabIndex={0}
        aria-label={label}
        className="scrollbar-hide -mx-1 flex snap-x snap-mandatory gap-4 overflow-x-auto rounded-2xl p-1 outline-focus-ring focus-visible:outline-2"
      >
        {slides.map((slide, position) => (
          <li
            key={position}
            aria-roledescription="slide"
            aria-label={`Step ${String(position + 1)} of ${String(slides.length)}`}
            className="w-[85%] shrink-0 snap-start sm:w-[21rem]"
          >
            {slide}
          </li>
        ))}
      </ol>
    </div>
  );
}
