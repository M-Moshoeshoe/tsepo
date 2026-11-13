import { LinkExternal01 } from '@untitledui/icons';
import type { ReactNode } from 'react';
import { Badge } from '@/components/base/badges/badges';
import { cx } from '@/utils/cx';
import { TESTNET_EXPLORER } from '../src/ledger/testnet.ts';
import type { Tone } from '../src/views/status.ts';
import { CopyButton } from './copy-button.tsx';

/** A ledger address, hash or fingerprint in IBM Plex Mono. Long values break anywhere so they never overflow. */
export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx('font-mono text-[13px] break-all text-primary', className)}>{children}</span>;
}

/** A value people may need to paste elsewhere: an address, hash or fingerprint, with a copy button. */
export function CopyableMono({ value, label, className }: { value: string; label: string; className?: string }) {
  return (
    <span className="inline-flex max-w-full items-start gap-1">
      <Mono className={cx('min-w-0', className)}>{value}</Mono>
      <CopyButton value={value} label={label} />
    </span>
  );
}

/** "rMQqus...QciiPp": enough of an address to recognise it, with the full value on hover. */
export function ShortAddress({ address, className }: { address: string; className?: string }) {
  return (
    <span className={cx('font-mono text-[13px] text-tertiary', className)} title={address}>
      {address.slice(0, 6)}...{address.slice(-6)}
    </span>
  );
}

/** An amount and its asset, with tabular figures so columns of numbers line up. */
export function Amount({
  value,
  asset = 'RLUSD',
  className,
}: {
  value: string | undefined;
  asset?: string | undefined;
  className?: string;
}) {
  return <span className={cx('tabular-nums', className)}>{value === undefined ? 'Not recorded' : `${value} ${asset}`}</span>;
}

export function ExplorerLink({ hash, children }: { hash: string; children?: ReactNode }) {
  return (
    <a
      href={`${TESTNET_EXPLORER}/transactions/${hash}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-sm text-sm font-semibold text-brand-secondary outline-focus-ring hover:text-brand-secondary_hover focus-visible:outline-2"
    >
      {children ?? 'View on the ledger explorer'}
      <LinkExternal01 className="size-3.5" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

const TONE_COLORS = { cleared: 'success', held: 'warning', refused: 'error', neutral: 'gray' } as const;

/** A status chip in the Tšepo status colours. Colours change smoothly when the status changes (motion 3). */
export function StatusBadge({
  tone,
  children,
  size = 'sm',
  className,
}: {
  tone: Tone | 'neutral';
  children: ReactNode;
  size?: 'sm' | 'md';
  className?: string;
}) {
  return (
    <Badge type="pill-color" color={TONE_COLORS[tone]} size={size} className={cx('status-transition', className)}>
      {children}
    </Badge>
  );
}

/** A two-column list of facts that stacks on narrow screens. */
export function Facts({ items }: { items: { term: ReactNode; value: ReactNode; key?: string }[] }) {
  return (
    <dl className="grid gap-3">
      {items.map((item, index) => (
        <div
          key={item.key ?? (typeof item.term === 'string' ? item.term : String(index))}
          className="grid gap-0.5 sm:grid-cols-[minmax(0,9rem)_minmax(0,1fr)] sm:gap-6"
        >
          <dt className="text-sm text-tertiary">{item.term}</dt>
          <dd className="min-w-0 text-sm text-primary">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A section title with an optional action on the right. Sections are separated by space, not boxes. */
export function SectionTitle({ title, aside, id }: { title: string; aside?: ReactNode; id?: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 id={id} className="text-lg font-semibold text-primary">
        {title}
      </h2>
      {aside}
    </div>
  );
}
