'use client';

import { useRouter } from 'next/navigation';
import { useState, type SyntheticEvent } from 'react';
import { Button } from '@/components/base/buttons/button';
import { Input } from '@/components/base/input/input';
import { Toggle } from '@/components/base/toggle/toggle';
import { MAX_EVERY_MINUTES, MIN_EVERY_MINUTES, ScheduleSettingsSchema, type ScheduleSettings } from '../../src/schedule/schedule.ts';
import { postWithCode } from '../coded-request.ts';
import { useRun } from '../run-provider.tsx';
import { useLiveActions } from '../shell/live-actions.tsx';

/**
 * The business decides whether the agent processes its instruction inbox by
 * itself, and how often. The agent cannot change this; the change needs the
 * access code.
 */
export function ScheduleSettingsForm({ settings, line }: { settings: ScheduleSettings; line: string }) {
  const router = useRouter();
  const { accessCode } = useRun();
  const { unlock } = useLiveActions();
  const [enabled, setEnabled] = useState(settings.enabled);
  const [minutes, setMinutes] = useState(String(settings.everyMinutes));
  const [message, setMessage] = useState<{ tone: 'error' | 'saved'; text: string } | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  async function save(event: SyntheticEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    const parsed = ScheduleSettingsSchema.safeParse({ enabled, everyMinutes: Number(minutes) });
    if (!parsed.success) {
      setMessage({ tone: 'error', text: parsed.error.issues[0]?.message ?? 'Check the setting and try again.' });
      return;
    }
    if (accessCode === undefined) {
      unlock();
      return;
    }
    setSaving(true);
    const error = await postWithCode('/api/schedule', parsed.data, accessCode);
    setSaving(false);
    if (error !== undefined) {
      setMessage({ tone: 'error', text: error });
      return;
    }
    setMessage({ tone: 'saved', text: parsed.data.enabled ? `Saved. The agent processes its inbox every ${String(parsed.data.everyMinutes)} minutes, counted from now.` : 'Saved. Automatic runs are off.' });
    router.refresh();
  }

  return (
    <form
      onSubmit={(event) => {
        void save(event);
      }}
      className="grid gap-4"
      noValidate
    >
      <p className="text-sm text-secondary" role="status">
        {line}
      </p>
      <Toggle label="Process the instruction inbox automatically" hint="The agent pays what is in the inbox by itself, within these rules. No person needs to send it." isSelected={enabled} onChange={setEnabled} />
      <Input
        label="Every how many minutes"
        type="number"
        inputMode="numeric"
        value={minutes}
        onChange={setMinutes}
        isDisabled={!enabled}
        hint={`From ${String(MIN_EVERY_MINUTES)} to ${String(MAX_EVERY_MINUTES)} minutes. The default is 10.`}
        className="max-w-48"
      />
      {message !== undefined && (
        <p role={message.tone === 'error' ? 'alert' : 'status'} className={message.tone === 'error' ? 'text-sm text-error-primary' : 'text-sm text-success-primary'}>
          {message.text}
        </p>
      )}
      <div>
        <Button type="submit" color="secondary" size="md" isLoading={saving} showTextWhileLoading>
          {accessCode === undefined ? 'Enter the access code to save' : 'Save the schedule'}
        </Button>
      </div>
    </form>
  );
}
