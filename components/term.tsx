'use client';

import { Popover } from 'radix-ui';
import type { ReactNode } from 'react';
import { GLOSSARY, type GlossaryTerm } from '../src/views/glossary.ts';

/**
 * A word of jargon with a one-line explanation. It opens on tap, click,
 * Enter or Space, and closes on Escape or a tap outside, so it works with a
 * keyboard and on touch screens.
 */
export function Term({ term, children }: { term: GlossaryTerm; children: ReactNode }) {
  return (
    <Popover.Root>
      <Popover.Trigger
        className="cursor-help rounded-sm text-inherit underline decoration-muted decoration-dotted underline-offset-4"
        aria-label={`${typeof children === 'string' ? children : term}, what this means`}
      >
        {children}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={6}
          collisionPadding={16}
          className="dialog-fade z-50 max-w-72 rounded-md border border-border bg-ink px-3 py-2 text-sm leading-snug text-white"
        >
          {GLOSSARY[term]}
          <Popover.Arrow className="fill-ink" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
