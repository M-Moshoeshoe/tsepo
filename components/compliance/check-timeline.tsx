import type { Check } from '../../src/views/checks.ts';
import { Timeline, type TimelineState } from '../timeline.tsx';

const STATE: Record<Check['state'], { state: TimelineState; text: string }> = {
  passed: { state: 'passed', text: 'Passed' },
  failed: { state: 'failed', text: 'Failed' },
  'not-checked': { state: 'pending', text: 'Not checked' },
};

/** The checks for one payment, ticking in one after another. The only animation in the interface. */
export function CheckTimeline({ checks }: { checks: Check[] }) {
  return (
    <Timeline
      label="Checks"
      animate
      live
      items={checks.map((check) => ({ id: check.id, label: check.label, state: STATE[check.state].state, stateText: STATE[check.state].text }))}
    />
  );
}
