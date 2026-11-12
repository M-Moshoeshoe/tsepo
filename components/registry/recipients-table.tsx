'use client';

import { Table } from '@/components/application/table/table';
import { ShortAddress } from '../display.tsx';

export interface RecipientRow {
  name: string;
  address: string;
  destinationTag: number | undefined;
  paidThrough: string | undefined;
}

const HEAD = 'px-4 lg:px-5';
const CELL = 'px-4 py-2.5 lg:px-5';

/** The people the agent may pay, as a compact table. */
export function RecipientsTable({ recipients }: { recipients: RecipientRow[] }) {
  return (
    <Table size="sm" aria-label="Approved recipients">
      <Table.Header>
        <Table.Head id="name" label="Name" isRowHeader className={HEAD} />
        <Table.Head id="through" label="Paid through" className={HEAD} />
        <Table.Head id="tag" label="Destination tag" className={`${HEAD} *:justify-end`} />
        <Table.Head id="account" label="Account" className={`${HEAD} max-sm:hidden`} />
      </Table.Header>
      <Table.Body items={recipients.map((recipient) => ({ ...recipient, id: `${recipient.address}-${String(recipient.destinationTag)}` }))}>
        {(recipient) => (
          <Table.Row id={recipient.id} className="h-auto">
            <Table.Cell className={`${CELL} font-medium text-primary`}>{recipient.name}</Table.Cell>
            <Table.Cell className={CELL}>{recipient.paidThrough ?? 'Paid directly'}</Table.Cell>
            <Table.Cell className={`${CELL} text-right tabular-nums`}>{recipient.destinationTag ?? 'None'}</Table.Cell>
            <Table.Cell className={`${CELL} max-sm:hidden`}>
              <ShortAddress address={recipient.address} />
            </Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </Table>
  );
}
