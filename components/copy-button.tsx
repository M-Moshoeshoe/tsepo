'use client';

import { Check, Copy } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from './ui/cn.ts';

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
    <span className={cn('inline-flex shrink-0 items-center gap-1 align-middle', className)}>
      <button
        type="button"
        onClick={() => {
          void copy();
        }}
        className="press inline-flex size-6 items-center justify-center rounded-md text-muted hover:bg-background hover:text-ink"
        aria-label={`Copy ${label}`}
      >
        {state === 'copied' ? <Check className="size-3.5 text-cleared" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
      </button>
      <span aria-live="polite" className={cn('text-xs font-medium', state === 'failed' ? 'text-refused' : 'text-cleared')}>
        {state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy failed' : ''}
      </span>
    </span>
  );
}
