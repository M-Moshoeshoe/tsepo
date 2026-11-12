import Link from 'next/link';
import { STATUS_LABELS, STATUS_TONES, type BusinessPayment } from '../../src/views/payments.ts';
import { formatSast } from '../../src/views/status.ts';
import { Amount, StatusBadge } from '../display.tsx';

/** A short list of payments, each a link that opens its details panel. Used on the Overview and in each instruction. */
export function PaymentList({ items, label }: { items: { payment: BusinessPayment; href: string }[]; label: string }) {
  return (
    <ol aria-label={label} className="grid">
      {items.map(({ payment, href }) => (
        <li key={payment.id} className="border-t border-secondary first:border-t-0">
          <Link href={href} scroll={false} className="grid gap-1 rounded-md px-2 py-3 outline-focus-ring hover:bg-secondary focus-visible:outline-2">
            <span className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-sm text-primary">
                <Amount value={payment.intent.amount} className="font-semibold" /> to {payment.intent.payee}
              </span>
              <StatusBadge tone={STATUS_TONES[payment.status]}>{STATUS_LABELS[payment.status]}</StatusBadge>
            </span>
            <span className="text-xs text-tertiary tabular-nums">
              {payment.intent.reference}, {formatSast(payment.at)}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
