import { ExternalLink } from 'lucide-react';
import type { ReactNode } from 'react';
import { TESTNET_EXPLORER } from '../src/ledger/testnet.ts';
import { cn } from './ui/cn.ts';

/** A ledger address, hash or fingerprint in IBM Plex Mono. Long values break anywhere so they never overflow. */
export function Mono({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('font-mono text-[13px] break-all text-ink', className)}>{children}</span>;
}

/** An amount with tabular figures, so columns of numbers line up. */
export function Amount({ value, className }: { value: string | undefined; className?: string }) {
  return <span className={cn('tabular-nums', className)}>{value === undefined ? 'No RLUSD' : `${value} RLUSD`}</span>;
}

export function ExplorerLink({ hash, children }: { hash: string; children?: ReactNode }) {
  return (
    <a
      href={`${TESTNET_EXPLORER}/transactions/${hash}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-primary underline-offset-2 hover:underline"
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
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id ?? title}-heading`} className={cn('rounded-md border border-border bg-surface', className)}>
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 id={`${id ?? title}-heading`} className="text-base font-semibold text-ink">
          {title}
        </h2>
        {aside}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

/** A two-column list of facts that stacks on narrow screens. */
export function Facts({ items }: { items: { term: string; value: ReactNode }[] }) {
  return (
    <dl className="grid gap-3">
      {items.map((item) => (
        <div key={item.term} className="grid gap-0.5 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] sm:gap-6">
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

/** The Tšepo mark. The accent colour is used here and on the assistant mark only. */
export function Logo() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <rect width="24" height="24" rx="6" className="fill-accent" />
      <path d="M6.5 8h11M12 8v9.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Marks content produced by the AI assistant (Claude). */
export function AssistantMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-4 shrink-0" aria-hidden>
      <rect width="16" height="16" rx="4" className="fill-accent" />
      <path d="M4.5 5.5h7M4.5 8h7M4.5 10.5h4" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );
}
