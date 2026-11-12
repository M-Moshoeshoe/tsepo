'use client';

import { Check, Copy01 } from '@untitledui/icons';
import { useEffect, useState } from 'react';
import { cx } from '@/utils/cx';

const CONFIRM_MS = 2000;

/** Copies a value and confirms with a visible, announced "Copied". */
export function CopyButton({ value, label, className }: { value: string; label: string; className?: string }) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  useEffect(() => {
    if (state === 'idle') return;
    const timer = setTimeout(() => {
      setState('idle');
    }, CONFIRM_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [state]);

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(value);
      setState('copied');
    } catch {
      setState('failed');
    }
  }

  return (
    <span className={cx('inline-flex shrink-0 items-center gap-1 align-middle', className)}>
      <button
        type="button"
        onClick={() => {
          void copy();
        }}
        className="press inline-flex size-6 items-center justify-center rounded-md text-fg-quaternary outline-focus-ring hover:bg-primary_hover hover:text-fg-secondary focus-visible:outline-2"
        aria-label={`Copy ${label}`}
      >
        {state === 'copied' ? <Check className="size-3.5 text-fg-success-primary" aria-hidden /> : <Copy01 className="size-3.5" aria-hidden />}
      </button>
      <span aria-live="polite" className={cx('text-xs font-medium', state === 'failed' ? 'text-error-primary' : 'text-success-primary')}>
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : ''}
      </span>
    </span>
  );
}
