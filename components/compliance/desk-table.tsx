'use client';

import { Table } from '@/components/application/table/table';
import { actorName } from '../../src/views/actors.ts';
import { formatSastDate, formatSastTime } from '../../src/views/status.ts';
import type { DeskFilter } from '../../src/views/desk.ts';
import type { DeskEntry } from '../../app/_data/desk-entries.ts';
import { deskHref } from '../../app/compliance/desk-href.ts';
import { Amount, ShortAddress, StatusBadge } from '../display.tsx';

const HEAD = 'px-4 lg:px-5';
const CELL = 'px-4 py-2.5 lg:px-5';

/**
 * A compact table of payments and stopped attempts, newest first. Each row is
 * a link that opens the payment details. Sender and Decided by step aside on
 * narrow screens; both are in the details.
 */
export function DeskTable({ entries, filter, earlier }: { entries: DeskEntry[]; filter: DeskFilter; earlier: boolean }) {
  return (
    <Table size="sm" aria-label="Payments into the agent lane and attempts stopped before they reached it, newest first">
      <Table.Header>
        <Table.Head id="time" label="Time (SAST)" isRowHeader className={HEAD} />
        <Table.Head id="sender" label="Sender" className={`${HEAD} max-sm:hidden`} />
        <Table.Head id="amount" label="Amount" className={`${HEAD} *:justify-end`} />
        <Table.Head id="status" label="Status" className={HEAD} />
        <Table.Head id="decided" label="Decided by" className={`${HEAD} max-md:hidden`} />
      </Table.Header>
      <Table.Body items={entries}>
        {(entry) => (
          <Table.Row
            id={entry.id}
            href={deskHref({ filter, earlier, entry: entry.id })}
            routerOptions={{ scroll: false }}
            textValue={`${formatSastTime(entry.at)}, ${entry.senderName}, ${entry.status.chip}`}
            className="h-auto cursor-pointer"
          >
            <Table.Cell className={`${CELL} whitespace-nowrap`}>
              <span className="grid">
                <span className="font-medium text-primary tabular-nums">{formatSastTime(entry.at).replace(' SAST', '')}</span>
                <span className="text-xs text-tertiary">{formatSastDate(entry.at)}</span>
              </span>
            </Table.Cell>
            <Table.Cell className={`${CELL} max-sm:hidden`}>
              <span className="grid">
                <span className="text-primary">{entry.senderName}</span>
                <ShortAddress address={entry.sender} className="text-xs" />
              </span>
            </Table.Cell>
            <Table.Cell className={`${CELL} text-right whitespace-nowrap`}>
              <Amount value={entry.amount} asset={entry.asset ?? 'RLUSD'} className="font-medium text-primary" />
            </Table.Cell>
            <Table.Cell className={CELL}>
              <StatusBadge tone={entry.status.tone} className="max-sm:h-auto max-sm:w-fit max-sm:whitespace-normal">
                {entry.status.chip}
              </StatusBadge>
            </Table.Cell>
            <Table.Cell className={`${CELL} max-md:hidden`}>
              <span className="grid">
                <span>{actorName(entry.decidedBy, true)}</span>
                {entry.kind === 'refusal' && <span className="text-xs text-tertiary">Reported by the agent&apos;s policy service</span>}
              </span>
            </Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </Table>
  );
}
