'use client';

import { Button } from './ui/button.tsx';
import { Skeleton } from './ui/skeleton.tsx';

/** Shown while a screen reads the ledger. Static: only the check timeline moves. */
export function PageLoading({ title }: { title: string }) {
  return (
    <div className="grid gap-6" aria-busy="true">
      <div>
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-muted" role="status">
          Reading the XRP Ledger Testnet and the service records.
        </p>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

/** Shown when a screen cannot read its data. It shows nothing it could not verify. */
export function PageError({ title, retry }: { title: string; retry: () => void }) {
  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-semibold text-ink">{title}</h1>
      <div role="alert" className="grid gap-3 rounded-md border border-border bg-surface p-4">
        <p className="text-sm font-medium text-refused">This screen could not read the ledger or the service records.</p>
        <p className="text-sm text-ink">
          Nothing is shown, so you never see a status that was not checked. No payment was made or changed. Check the network
          connection and try again.
        </p>
        <div>
          <Button onClick={retry}>Try again</Button>
        </div>
      </div>
    </div>
  );
}
