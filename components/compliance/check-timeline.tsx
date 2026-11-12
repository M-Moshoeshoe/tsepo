import { CheckCircle2, CircleDashed, XCircle } from 'lucide-react';
import type { Check } from '../../src/views/checks.ts';
import { cn } from '../ui/cn.ts';

const STATE_TEXT: Record<Check['state'], string> = { passed: 'Passed', failed: 'Failed', 'not-checked': 'Not checked' };

/** Step delay for the timeline. Reduced motion shows every check at once (see globals.css). */
const STEP_MS = 220;

/**
 * The checks for one payment, ticking in one after another. This is the only
 * animation in the interface. The list is a live region, so the result is read out.
 */
export function CheckTimeline({ checks }: { checks: Check[] }) {
  return (
    <ol aria-live="polite" aria-label="Checks" className="grid gap-0">
      {checks.map((check, index) => (
        <li
          key={check.id}
          className="check-animate relative flex items-center gap-3 pb-3 last:pb-0"
          style={{ animationDelay: `${index * STEP_MS}ms` }}
        >
          {index < checks.length - 1 && <span className="absolute top-6 bottom-0 left-[9px] w-px bg-border" aria-hidden />}
          <span className="relative flex size-5 items-center justify-center bg-surface">
            {check.state === 'passed' && <CheckCircle2 className="size-5 text-cleared" aria-hidden />}
            {check.state === 'failed' && <XCircle className="size-5 text-refused" aria-hidden />}
            {check.state === 'not-checked' && <CircleDashed className="size-5 text-muted" aria-hidden />}
          </span>
          <span className="flex flex-1 flex-wrap items-baseline justify-between gap-2 text-sm">
            <span className="font-medium text-ink">{check.label}</span>
            <span
              className={cn(
                'text-xs font-medium',
                check.state === 'passed' && 'text-cleared',
                check.state === 'failed' && 'text-refused',
                check.state === 'not-checked' && 'text-muted',
              )}
            >
              {STATE_TEXT[check.state]}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}
