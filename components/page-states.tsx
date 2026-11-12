'use client';

import { Button } from './ui/button.tsx';

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
