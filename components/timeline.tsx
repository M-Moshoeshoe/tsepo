import { CheckCircle2, CircleDashed, XCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from './ui/cn.ts';

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
 * A compact vertical timeline. Only the compliance check timeline animates;
 * as a live region it is read out when it changes.
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
          className={cn('relative flex gap-3 pb-3 last:pb-0', animate && 'check-animate')}
          style={animate ? { animationDelay: `${index * STEP_MS}ms` } : undefined}
        >
          {index < items.length - 1 && <span className="absolute top-6 bottom-0 left-[9px] w-px bg-border" aria-hidden />}
          <span className="relative flex size-5 shrink-0 items-center justify-center bg-surface">
            {item.state === 'passed' && <CheckCircle2 className="size-5 text-cleared" aria-hidden />}
            {item.state === 'failed' && <XCircle className="size-5 text-refused" aria-hidden />}
            {item.state === 'pending' && <CircleDashed className="size-5 text-muted" aria-hidden />}
          </span>
          <span className="grid min-w-0 flex-1 gap-0.5 text-sm">
            <span className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="font-medium text-ink">{item.label}</span>
              <span
                className={cn(
                  'text-xs font-medium',
                  item.state === 'passed' && 'text-cleared',
                  item.state === 'failed' && 'text-refused',
                  item.state === 'pending' && 'text-muted',
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
