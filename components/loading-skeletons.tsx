import { Skeleton } from './ui/skeleton.tsx';

function Reading() {
  return (
    <p role="status" className="text-sm text-muted">
      Reading the XRP Ledger Testnet and the service records.
    </p>
  );
}

/** A section frame with its real title and placeholder rows, matching the loaded layout. */
function SectionSkeleton({ title, rows, children }: { title: string; rows?: number; children?: React.ReactNode }) {
  return (
    <div className="rounded-md border border-border bg-surface">
      <div className="border-b border-border px-4 py-3 text-base font-semibold text-ink">{title}</div>
      <div className="grid gap-3 p-4">
        {children ??
          Array.from({ length: rows ?? 4 }, (_, index) => (
            <div key={index} className="grid gap-1 sm:grid-cols-[10rem_1fr] sm:gap-6">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-full max-w-72" />
            </div>
          ))}
      </div>
    </div>
  );
}

export function RegistrySkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true">
      <div className="grid gap-1">
        <Reading />
      </div>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="grid content-start gap-6">
          <SectionSkeleton title="Business" />
          <SectionSkeleton title="Agent" />
          <SectionSkeleton title="Mandate" rows={5} />
        </div>
        <SectionSkeleton title="Agent activity">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-10 w-full" />
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="flex items-center gap-3">
              <Skeleton className="size-5 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
          ))}
        </SectionSkeleton>
      </div>
    </div>
  );
}

export function DeskSkeleton() {
  return (
    <div className="grid gap-6" aria-busy="true">
      <div className="grid gap-1">
        <h2 className="text-xl font-semibold text-ink">Demo Exchange, agent lane</h2>
        <Reading />
      </div>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,6fr)]">
        <SectionSkeleton title="Payments and refused attempts">
          <div className="flex gap-2">
            {Array.from({ length: 5 }, (_, index) => (
              <Skeleton key={index} className="h-7 w-20" />
            ))}
          </div>
          {Array.from({ length: 5 }, (_, index) => (
            <div key={index} className="grid grid-cols-[5rem_1fr_5rem_6rem] gap-3">
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-4" />
              <Skeleton className="h-5" />
            </div>
          ))}
        </SectionSkeleton>
        <div className="hidden lg:block">
          <SectionSkeleton title="Details">
            <Skeleton className="h-6 w-48" />
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="grid grid-cols-[10rem_1fr] gap-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-full max-w-72" />
              </div>
            ))}
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center gap-3">
                <Skeleton className="size-5 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            ))}
          </SectionSkeleton>
        </div>
      </div>
    </div>
  );
}
