'use client';

import { PauseCircle, PlayCircle } from '@untitledui/icons';
import { Children, useEffect, useState, type ReactNode } from 'react';
import { cx } from '@/utils/cx';

const STEP_MS = 3200;

/**
 * Brings the four moments forward one at a time, in the order a payment's
 * life runs, so a visitor reads them as a sequence. It never hides a card. A
 * pause button stops it, and with reduced motion it never starts.
 */
export function MomentSequence({ labels, children }: { labels: string[]; children: ReactNode }) {
  const cards = Children.toArray(children);
  const [active, setActive] = useState<number | undefined>(undefined);
  const [playing, setPlaying] = useState(false);
  const [motion, setMotion] = useState(false);

  useEffect(() => {
    const allowed = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setMotion(allowed);
    setPlaying(allowed);
    if (allowed) setActive(0);
  }, []);

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => {
      setActive((current) => ((current ?? -1) + 1) % cards.length);
    }, STEP_MS);
    return () => {
      window.clearInterval(timer);
    };
  }, [playing, cards.length]);

  return (
    <div className="grid gap-3">
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <li
            key={labels[index] ?? index}
            className={cx(
              'grid rounded-xl transition-[box-shadow,transform] duration-500',
              active === index ? '-translate-y-0.5 shadow-lg ring-2 ring-brand' : 'ring-0',
            )}
          >
            {card}
          </li>
        ))}
      </ol>
      {motion && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-tertiary" aria-hidden>
            {active === undefined ? '' : `${String(active + 1)} of ${String(cards.length)}: ${labels[active] ?? ''}`}
          </p>
          <button
            type="button"
            onClick={() => {
              setPlaying((current) => !current);
            }}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-semibold text-secondary outline-focus-ring hover:bg-primary hover:text-primary focus-visible:outline-2"
          >
            {playing ? <PauseCircle className="size-4" aria-hidden /> : <PlayCircle className="size-4" aria-hidden />}
            {playing ? 'Pause' : 'Play'}
          </button>
        </div>
      )}
    </div>
  );
}
