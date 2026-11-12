'use client';

import { AlertTriangle } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { FeaturedIcon } from '@/components/foundations/featured-icon/featured-icon';

/** Shown when a screen cannot read its data. It shows nothing it could not verify. */
export function PageError({ retry }: { retry: () => void }) {
  return (
    <div role="alert" className="flex max-w-xl flex-col items-start gap-4 rounded-xl bg-secondary p-6">
      <FeaturedIcon icon={AlertTriangle} color="error" theme="light" size="md" />
      <div className="grid gap-1">
        <p className="text-md font-semibold text-primary">This screen could not read the ledger or the service records.</p>
        <p className="text-sm text-tertiary">
          Nothing is shown, so you never see a status that was not checked. No payment was made or changed. Check the network
          connection and try again.
        </p>
      </div>
      <Button color="primary" size="md" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}
