import { ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';
import { TESTNET_EXPLORER } from '../src/ledger/testnet.ts';
import { CopyButton } from './copy-button.tsx';
import { cn } from './ui/cn.ts';

/** A ledger address, hash or fingerprint in IBM Plex Mono. Long values break anywhere so they never overflow. */
export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('font-mono text-[13px] break-all text-ink', className)}>{children}</span>;
}

/** A value people may need to paste elsewhere: an address, hash or fingerprint, with a copy button. */
export function CopyableMono({ value, label, className }: { value: string; label: string; className?: string }) {
  return (
    <span className="inline-flex max-w-full items-start gap-1">
      <Mono className={cn('min-w-0', className)}>{value}</Mono>
      <CopyButton value={value} label={label} />
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
  return <span className={cn('tabular-nums', className)}>{value === undefined ? 'Not recorded' : `${value} ${asset}`}</span>;
}

export function ExplorerLink({ hash, children }: { hash: string; children?: ReactNode }) {
  return (
    <a
      href={`${TESTNET_EXPLORER}/transactions/${hash}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-teal underline-offset-2 hover:underline"
    >
      {children ?? 'View on the ledger explorer'}
      <ExternalLink className="size-3.5" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/** Marks sample business and travel data, so nobody takes it for a real company. */
export function DemoDataTag() {
  return <span className="rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted">Demo data</span>;
}

export function Section({
  title,
  aside,
  children,
  id,
  className,
  flush = false,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  id?: string;
  className?: string;
  /** Lets the content, such as a table, run to the section edges. */
  flush?: boolean;
}) {
  // Ids cannot contain spaces: aria-labelledby would read them as several ids.
  const headingId = `${id ?? title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-heading`;
  return (
    <section id={id} aria-labelledby={headingId} className={cn('rounded-md border border-border bg-surface', className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 id={headingId} className="text-base font-semibold text-ink">
          {title}
        </h2>
        {aside}
      </div>
      <div className={flush ? undefined : 'p-4'}>{children}</div>
    </section>
  );
}

/** A two-column list of facts that stacks on narrow screens. */
export function Facts({ items }: { items: { term: ReactNode; value: ReactNode; key?: string }[] }) {
  return (
    <dl className="grid gap-3">
      {items.map((item, index) => (
        <div
          key={item.key ?? (typeof item.term === 'string' ? item.term : String(index))}
          className="grid gap-0.5 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:gap-6"
        >
          <dt className="text-sm text-muted">{item.term}</dt>
          <dd className="min-w-0 text-sm text-ink">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-border px-4 py-8 text-center">
      <p className="text-sm font-medium text-ink">{title}</p>
      {children !== undefined && <p className="mt-1 text-sm text-muted">{children}</p>}
    </div>
  );
}

/**
 * The Tšepo mark: an open ring held around a solid core, a promise kept open
 * around a fixed centre. Accent colour only; it stays legible at 20px.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn('shrink-0 text-accent', className)} aria-hidden>
      <path d="M12 3.5a8.5 8.5 0 1 1-8.5 8.5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="12" cy="12" r="3.25" fill="currentColor" />
    </svg>
  );
}

export function Logo() {
  return <Mark className="size-6" />;
}

/** Marks content produced by the AI assistant (Claude), with the same mark. */
export function AssistantMark() {
  return <Mark className="size-4" />;
}
