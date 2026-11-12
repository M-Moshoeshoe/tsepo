'use client';

import { Table } from '@/components/application/table/table';
import { STATUS_LABELS, STATUS_TONES, type BusinessPayment } from '../../src/views/payments.ts';
import { formatSastDate, formatSastTime } from '../../src/views/status.ts';
import { Amount, StatusBadge } from '../display.tsx';

const HEAD = 'px-4 lg:px-5';
const CELL = 'px-4 py-2.5 lg:px-5';

/**
 * The business's payments, newest first. Each row is a link that opens the
 * payment's details panel. Reference steps aside on narrow screens; it is in the details.
 */
export function PaymentsTable({ rows }: { rows: { payment: BusinessPayment; href: string }[] }) {
  return (
    <Table size="sm" aria-label="Payments by the agent, newest first">
      <Table.Header>
        <Table.Head id="time" label="Date and time (SAST)" isRowHeader className={HEAD} />
        <Table.Head id="recipient" label="Recipient" className={HEAD} />
        <Table.Head id="reference" label="Reference" className={`${HEAD} max-sm:hidden`} />
        <Table.Head id="amount" label="Amount" className={`${HEAD} *:justify-end`} />
        <Table.Head id="status" label="Status" className={HEAD} />
      </Table.Header>
      <Table.Body items={rows.map((row) => ({ ...row, id: row.payment.id }))}>
        {({ payment, href }) => (
          <Table.Row
            id={payment.id}
            href={href}
            routerOptions={{ scroll: false }}
            textValue={`${payment.intent.reference}, ${payment.intent.payee}, ${STATUS_LABELS[payment.status]}`}
            className="h-auto cursor-pointer"
          >
            <Table.Cell className={`${CELL} whitespace-nowrap`}>
              <span className="grid">
                <span className="font-medium text-primary tabular-nums">{formatSastTime(payment.at).replace(' SAST', '')}</span>
                <span className="text-xs text-tertiary">{formatSastDate(payment.at)}</span>
              </span>
            </Table.Cell>
            <Table.Cell className={CELL}>
              <span className="text-primary">{payment.intent.payee}</span>
            </Table.Cell>
            <Table.Cell className={`${CELL} text-secondary tabular-nums max-sm:hidden`}>{payment.intent.reference}</Table.Cell>
            <Table.Cell className={`${CELL} text-right whitespace-nowrap`}>
              <Amount value={payment.intent.amount} className="font-medium text-primary" />
            </Table.Cell>
            <Table.Cell className={CELL}>
              <StatusBadge tone={STATUS_TONES[payment.status]}>{STATUS_LABELS[payment.status]}</StatusBadge>
            </Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </Table>
  );
}
