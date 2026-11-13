'use client';

import { Compass03, PlayCircle, X } from '@untitledui/icons';
import { useState } from 'react';
import { Button } from '@/components/base/buttons/button';
import { markTourSeen, useTour } from './tour-provider.tsx';

/**
 * A small first-visit offer of the tour. The shell renders it only for a
 * visitor who has not seen the tour. Once dismissed, or once the tour is
 * opened, it never shows again.
 */
export function TourPrompt() {
  const { open, show, playStory } = useTour();
  const [visible, setVisible] = useState(true);

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
      <div className="flex flex-wrap gap-2">
        <Button
          color="primary"
          size="sm"
          iconLeading={PlayCircle}
          onClick={() => {
            setVisible(false);
            playStory();
          }}
        >
          Play the story
        </Button>
        <Button
          color="secondary"
          size="sm"
          onClick={() => {
            setVisible(false);
            show(0);
          }}
        >
          Walk through it myself
        </Button>
        <Button color="link-gray" size="sm" onClick={dismiss}>
          Not now
        </Button>
      </div>
    </section>
  );
}
