'use client';

import { PlayCircle, RefreshCcw01, X } from '@untitledui/icons';
import { useEffect, useRef } from 'react';
import { Button } from '@/components/base/buttons/button';
import { actorName } from '../../src/views/actors.ts';
import { SCENARIOS } from '../../src/views/scenarios.ts';
import { useRun } from '../run-provider.tsx';
import { AccessCodeForm, ACCESS_CODE_REASON } from '../shell/access-code-dialog.tsx';
import { RESTORE_LABEL, useLiveActions } from '../shell/live-actions.tsx';
import { useTour } from './tour-provider.tsx';

function AccessSection() {
  const { accessCode, saveAccessCode, forgetAccessCode, busy } = useRun();
  if (accessCode !== undefined) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2.5 text-sm">
        <span className="flex items-center gap-2 font-medium text-secondary">
          <span className="size-2 rounded-full bg-fg-success-secondary" aria-hidden />
          Live steps unlocked
        </span>
        <Button color="link-gray" size="sm" onClick={forgetAccessCode} isDisabled={busy}>
          Forget the code
        </Button>
      </div>
    );
  }
  return (
    <section aria-labelledby="tour-access" className="grid gap-3 rounded-lg bg-secondary p-4">
      <h3 id="tour-access" className="text-sm font-semibold text-primary">
        Before you start
      </h3>
      <p className="text-sm text-tertiary">{ACCESS_CODE_REASON} Every screen can be browsed without it.</p>
      <AccessCodeForm onSave={saveAccessCode} />
    </section>
  );
}

/**
 * The guided tour, in a side panel that leaves the product usable beside it
 * (a sheet from the bottom on phones). This first version lists the four
 * stories with a live run each; the step-by-step tour replaces it later.
 */
export function TourPanel() {
  const { open, close } = useTour();
  const { busy, locked, runStory, restore } = useLiveActions();
  const heading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (open) heading.current?.focus();
  }, [open]);

  return (
    <aside
      id="guided-tour"
      aria-labelledby="tour-title"
      hidden={!open}
      onKeyDown={(event) => {
        if (event.key === 'Escape') close();
      }}
      className="fixed inset-x-0 bottom-0 z-40 flex max-h-[75dvh] flex-col overflow-hidden rounded-t-2xl bg-primary shadow-xl ring-1 ring-secondary lg:inset-x-auto lg:top-0 lg:right-0 lg:max-h-none lg:w-100 lg:rounded-none"
    >
      <div className="flex items-center justify-between gap-3 border-b border-secondary px-5 py-4">
        {/* Focus lands here when the panel opens. It is not a control, so it shows no focus ring; the inline style beats the global one. */}
        <h2 id="tour-title" ref={heading} tabIndex={-1} className="text-lg font-semibold text-primary" style={{ outline: 'none' }}>
          Guided tour
        </h2>
        <Button color="tertiary" size="sm" iconLeading={X} onClick={close} aria-label="Close the guided tour" />
      </div>

      <div className="grid content-start gap-5 overflow-y-auto px-5 py-5">
        <p className="text-sm text-secondary">
          Four short stories, each run live on the XRP Ledger Testnet in about 20 seconds. After each one, open the screens it
          changed.
        </p>

        <AccessSection />

        <ol className="grid gap-3" aria-label="Stories">
          {SCENARIOS.map((story, index) => (
            <li key={story.kind} className="grid gap-2 rounded-lg p-4 ring-1 ring-secondary">
              <p className="text-sm font-semibold text-primary">
                <span className="text-brand-secondary tabular-nums">{index + 1}</span> {story.title}
              </p>
              <p className="text-sm text-tertiary">{story.proves}</p>
              <p className="text-xs text-tertiary">Decided by {actorName(story.decidedBy)}</p>
              <Button
                color="secondary"
                size="sm"
                iconLeading={PlayCircle}
                isDisabled={busy || locked}
                aria-label={`Run live: ${story.title}`}
                onClick={() => {
                  runStory(story.kind);
                }}
                className="justify-self-start"
              >
                Run live on Testnet
              </Button>
            </li>
          ))}
        </ol>

        <div className="grid gap-2 border-t border-secondary pt-4">
          <p className="text-sm text-tertiary">
            Everyone sees the same sample workspace, so live steps change it for all visitors. {RESTORE_LABEL} puts back the sample
            agent, its limits and its RLUSD.
          </p>
          <Button color="secondary" size="sm" iconLeading={RefreshCcw01} isDisabled={busy || locked} onClick={restore} className="justify-self-start">
            {RESTORE_LABEL}
          </Button>
        </div>
      </div>
    </aside>
  );
}
