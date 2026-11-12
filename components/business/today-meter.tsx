import { ProgressBarBase } from '@/components/base/progress-indicators/progress-indicators';
import type { DailyUsage } from '../../src/views/usage.ts';
import { formatSastTime } from '../../src/views/status.ts';

/**
 * How much of today's limit the approval service has counted, against the
 * daily limit. When the sample workspace cleared the totals today, it says so,
 * because the count then starts from that time.
 */
export function TodayMeter({ usage, perPaymentLimit, totalsClearedAt }: { usage: DailyUsage; perPaymentLimit: string; totalsClearedAt: string | undefined }) {
  return (
    <div className="grid gap-3">
      <p className="flex flex-wrap items-baseline gap-x-2">
        <span className="text-display-xs font-semibold text-primary tabular-nums">{usage.used} RLUSD</span>
        <span className="text-sm text-tertiary tabular-nums">of {usage.limit} RLUSD today</span>
      </p>
      <ProgressBarBase value={usage.percent} label="Share of today's limit used" className="h-2 bg-tertiary" />
      <p className="text-sm text-secondary tabular-nums">
        {usage.left} RLUSD left today. Up to {perPaymentLimit} RLUSD per payment.
      </p>
      {totalsClearedAt !== undefined && (
        <p className="text-xs text-tertiary">
          Counted since {formatSastTime(totalsClearedAt)}, when the sample totals were last cleared.
        </p>
      )}
    </div>
  );
}
