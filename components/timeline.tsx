import { CheckCircle, Circle, XCircle } from '@untitledui/icons';
import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';

export type TimelineState = 'passed' | 'failed' | 'pending';

export interface TimelineItem {
  id: string;
  label: string;
  state: TimelineState;
  /** The state in words, so it never relies on colour alone. */
  stateText: string;
  detail?: ReactNode;
}

/** Step delay when animated. Reduced motion shows every item at once (see globals.css). */
const STEP_MS = 220;

/**
 * A compact vertical timeline, in the style of an Untitled UI activity feed.
 * Only the compliance check timeline animates (motion 2).
 */
export function Timeline({
  items,
  label,
  animate = false,
  live = false,
}: {
  items: TimelineItem[];
  label: string;
  animate?: boolean;
  live?: boolean;
}) {
  return (
    <ol aria-label={label} aria-live={live ? 'polite' : undefined} className="grid">
      {items.map((item, index) => (
        <li
          key={item.id}
          className={cx('relative flex gap-3 pb-4 last:pb-0', animate && 'check-animate')}
          style={animate ? { animationDelay: `${index * STEP_MS}ms` } : undefined}
        >
          {index < items.length - 1 && <span className="absolute top-6 bottom-1 left-[9.5px] w-px bg-border-secondary" aria-hidden />}
          <span className="relative flex size-5 shrink-0 items-center justify-center">
            {item.state === 'passed' && <CheckCircle className="size-5 text-fg-success-primary" aria-hidden />}
            {item.state === 'failed' && <XCircle className="size-5 text-fg-error-primary" aria-hidden />}
            {item.state === 'pending' && <Circle className="size-5 text-fg-quaternary" aria-hidden />}
          </span>
          <span className="grid min-w-0 flex-1 gap-0.5 text-sm">
            <span className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="font-medium text-primary">{item.label}</span>
              <span
                className={cx(
                  'text-xs font-medium',
                  item.state === 'passed' && 'text-success-primary',
                  item.state === 'failed' && 'text-error-primary',
                  item.state === 'pending' && 'text-tertiary',
                )}
              >
                {item.stateText}
              </span>
            </span>
            {item.detail}
          </span>
        </li>
      ))}
    </ol>
  );
}
