'use client';

import { ChevronDown } from '@untitledui/icons';
import { useState } from 'react';
import { Button } from '@/components/base/buttons/button';
import { cx } from '@/utils/cx';
import type { BusinessPayment } from '../../src/views/payments.ts';
import { AssistantNote } from '../assistant-note.tsx';
import { StatusBadge } from '../display.tsx';
import { ThusoAvatar } from '../thuso-avatar.tsx';
import { PaymentList } from './payment-list.tsx';

export interface InboxRow {
  id: string;
  /** When the instruction arrived, already formatted in SAST. */
  time: string;
  /** "Started by the schedule" or "Started by a person". */
  startedBy: string;
  /** Thuso's one-line reading. */
  summary: string;
  outcome: { label: string; tone: 'cleared' | 'held' | 'refused' | 'neutral' };
  text: string;
  /** Thuso's full note on what it read. */
  note: string;
  payments: { payment: BusinessPayment; href: string }[];
}

const STEP = 10;

/** The agent's instructions as an inbox: one compact row each, newest first, that opens to show its payments. */
export function InstructionInbox({ rows }: { rows: InboxRow[] }) {
  const [shown, setShown] = useState(STEP);
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());
  const toggle = (id: string): void => {
    setOpen((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="grid gap-3">
      <ol className="overflow-hidden rounded-xl ring-1 ring-secondary ring-inset" aria-label="Instructions, newest first">
        {rows.slice(0, shown).map((row) => {
          const expanded = open.has(row.id);
          const panelId = `instruction-${row.id}`;
          return (
            <li key={row.id} className="border-t border-secondary first:border-t-0">
              <button
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => {
                  toggle(row.id);
                }}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 px-4 py-3 text-left outline-focus-ring hover:bg-secondary focus-visible:outline-2 focus-visible:-outline-offset-2 sm:grid-cols-[9rem_minmax(0,1fr)_auto_auto] lg:px-5"
              >
                <span className="grid text-xs text-tertiary sm:text-sm">
                  <span className="tabular-nums">{row.time}</span>
                  <span className="text-xs">{row.startedBy}</span>
                </span>
                <span className="col-span-2 row-start-2 flex min-w-0 items-start gap-2 text-sm text-primary sm:col-span-1 sm:row-start-auto">
                  <ThusoAvatar />
                  <span>{row.summary}</span>
                </span>
                <StatusBadge tone={row.outcome.tone}>{row.outcome.label}</StatusBadge>
                <ChevronDown className={cx('size-4 text-fg-quaternary transition-transform max-sm:hidden', expanded && 'rotate-180')} aria-hidden />
              </button>
              <div id={panelId} hidden={!expanded} className="grid gap-3 border-t border-secondary bg-secondary_alt px-4 py-4 lg:px-5">
                <blockquote className="rounded-lg bg-primary px-3 py-2.5 text-sm whitespace-pre-wrap text-primary ring-1 ring-secondary ring-inset">
                  {row.text}
                </blockquote>
                <AssistantNote>{row.note}</AssistantNote>
                {row.payments.length > 0 && <PaymentList label={`Payments read from the instruction of ${row.time}`} items={row.payments} />}
              </div>
            </li>
          );
        })}
      </ol>
      {rows.length > shown && (
        <Button
          color="secondary"
          size="sm"
          className="justify-self-start"
          onClick={() => {
            setShown((current) => current + STEP);
          }}
        >
          {`Show more (${String(rows.length - shown)} older)`}
        </Button>
      )}
    </div>
  );
}
