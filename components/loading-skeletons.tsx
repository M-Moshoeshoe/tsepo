import type { ReactNode } from 'react';
import { cx } from '@/utils/cx';

/** A placeholder block with a gentle shimmer, still for reduced motion. */
function Skeleton({ className }: { className?: string }) {
  return <div className={cx('shimmer rounded-md', className)} aria-hidden />;
}

function Reading() {
  return (
    <p role="status" className="text-sm text-tertiary">
      Reading the XRP Ledger Testnet and the service records.
    </p>
  );
}

function Rows({ count, children }: { count: number; children: (index: number) => ReactNode }) {
  return <>{Array.from({ length: count }, (_, index) => children(index))}</>;
}

function FactRows({ count }: { count: number }) {
  return (
    <Rows count={count}>
      {(index) => (
        <div key={index} className="grid gap-1 sm:grid-cols-[9rem_1fr] sm:gap-6">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-full max-w-60" />
        </div>
      )}
    </Rows>
  );
}

function TableSkeleton({ columns, rows }: { columns: string; rows: number }) {
  return (
    <div className="overflow-hidden rounded-xl ring-1 ring-secondary">
      <div className="h-9 bg-secondary" />
      <Rows count={rows}>
        {(index) => (
          <div key={index} className={cx('grid items-center gap-4 border-t border-secondary px-4 py-3.5 lg:px-5', columns)}>
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-4" />
            <Skeleton className="h-5 rounded-full" />
          </div>
        )}
      </Rows>
    </div>
  );
}

/** The agent page while it loads: the same layout with placeholder rows. */
export function AgentSkeleton() {
  return (
    <div className="grid gap-8" aria-busy="true">
      <div className="grid gap-2">
        <Skeleton className="h-7 w-64" />
        <Reading />
      </div>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="grid gap-10">
          <div className="grid gap-5 rounded-xl bg-secondary p-6">
            <h2 className="text-lg font-semibold text-primary">Today</h2>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-2 w-full" />
          </div>
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold text-primary">Instructions</h2>
            <Rows count={2}>{(index) => <Skeleton key={index} className="h-40 rounded-xl" />}</Rows>
          </div>
        </div>
        <div className="grid gap-4">
          <h2 className="text-lg font-semibold text-primary">Identity</h2>
          <FactRows count={4} />
        </div>
      </div>
    </div>
  );
}

/** Incoming payments while they load: tabs and table rows in their real places. */
export function DeskSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true">
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold text-primary">Receiving exchange</h2>
        <Reading />
      </div>
      <div className="grid gap-4">
        <div className="flex gap-6 border-b border-secondary pb-2.5">
          <Rows count={5}>{(index) => <Skeleton key={index} className="h-5 w-16" />}</Rows>
        </div>
        <TableSkeleton columns="grid-cols-[4rem_1fr_5rem_6rem] sm:grid-cols-[5rem_1fr_6rem_8rem]" rows={6} />
      </div>
    </div>
  );
}

/** The Business Overview while it loads: the agent card, then recent payments. */
export function OverviewSkeleton() {
  return (
    <div className="grid items-start gap-10 xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]" aria-busy="true">
      <div className="grid gap-5 rounded-xl bg-secondary p-6">
        <Skeleton className="h-6 w-56" />
        <Reading />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-2 w-full" />
      </div>
      <div className="grid gap-4">
        <h2 className="text-lg font-semibold text-primary">Recent payments</h2>
        <Rows count={5}>{(index) => <Skeleton key={index} className="h-12" />}</Rows>
      </div>
    </div>
  );
}

/** A Business list page while it loads, such as Payments or Spending rules. */
export function BusinessListSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true">
      <Reading />
      <div className="flex gap-6 border-b border-secondary pb-2.5">
        <Rows count={4}>{(index) => <Skeleton key={index} className="h-5 w-20" />}</Rows>
      </div>
      <TableSkeleton columns="grid-cols-[5rem_1fr_6rem_8rem]" rows={6} />
    </div>
  );
}
