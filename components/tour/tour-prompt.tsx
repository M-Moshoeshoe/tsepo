'use client';

import { Compass03, X } from '@untitledui/icons';
import { useEffect, useState } from 'react';
import { Button } from '@/components/base/buttons/button';
import { markTourSeen, TOUR_SEEN_KEY, useTour } from './tour-provider.tsx';

function seenBefore(): boolean {
  try {
    return localStorage.getItem(TOUR_SEEN_KEY) !== null;
  } catch {
    return false;
  }
}

/** A small first-visit offer of the tour. Once dismissed, or once the tour is opened, it never shows again. */
export function TourPrompt() {
  const { open, show } = useTour();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!seenBefore());
  }, []);

  if (!visible || open) return null;

  const dismiss = (): void => {
    markTourSeen();
    setVisible(false);
  };

  return (
    <section
      aria-label="New here?"
      className="fixed right-4 bottom-4 left-4 z-30 grid gap-3 rounded-xl bg-primary p-4 shadow-lg ring-1 ring-secondary sm:left-auto sm:w-80"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Compass03 className="size-4 text-fg-brand-primary" aria-hidden />
          New here?
        </p>
        <Button color="tertiary" size="sm" iconLeading={X} onClick={dismiss} aria-label="Dismiss the tour offer" />
      </div>
      <p className="text-sm text-secondary">Take the 3-minute tour: four live steps on the XRP Ledger Testnet, each with its proof.</p>
      <div className="flex gap-3">
        <Button
          color="primary"
          size="sm"
          onClick={() => {
            setVisible(false);
            show(0);
          }}
        >
          Take the 3-minute tour
        </Button>
        <Button color="secondary" size="sm" onClick={dismiss}>
          Not now
        </Button>
      </div>
    </section>
  );
}
