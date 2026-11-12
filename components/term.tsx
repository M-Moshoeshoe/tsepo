'use client';

import type { ReactNode } from 'react';
import { Button, Dialog, DialogTrigger, OverlayArrow, Popover } from 'react-aria-components';
import { GLOSSARY, type GlossaryTerm } from '../src/views/glossary.ts';

const UNDERLINED =
  'cursor-help rounded-sm font-[inherit] text-[inherit] underline decoration-fg-quaternary decoration-dotted underline-offset-4 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2';

/**
 * A word of jargon with a one-line explanation. It opens on tap, click, Enter
 * or Space, and closes on Escape or a tap outside, so it works with a keyboard
 * and on touch screens. `className` replaces the dotted underline, for a term
 * shown as a badge.
 */
export function Term({ term, children, className }: { term: GlossaryTerm; children: ReactNode; className?: string }) {
  return (
    <DialogTrigger>
      <Button className={className ?? UNDERLINED} aria-label={`${typeof children === 'string' ? children : term}, what this means`}>
        {children}
      </Button>
      <Popover
        placement="top start"
        offset={8}
        className="dialog-fade z-50 max-w-72 rounded-lg bg-primary-solid px-3 py-2 text-sm leading-snug text-white shadow-lg outline-hidden"
      >
        <OverlayArrow>
          <svg viewBox="0 0 12 12" className="size-2.5 fill-bg-primary-solid">
            <path d="M0 0 L6 6 L12 0" />
          </svg>
        </OverlayArrow>
        <Dialog className="outline-hidden">{GLOSSARY[term]}</Dialog>
      </Popover>
    </DialogTrigger>
  );
}
