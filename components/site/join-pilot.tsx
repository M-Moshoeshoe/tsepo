'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { SiteButton, type ButtonSize, type ButtonVariant } from './site-button.tsx';

// The dialog and its form load on the first press, so the page carries none of their code.
const JoinPilotDialog = dynamic(() => import('./join-pilot-dialog.tsx').then((module) => module.JoinPilotDialog));

/** "Join the pilot": a button that opens a short form in a dialog. It wears the shared public button. */
export function JoinPilot({
  variant = 'primary',
  size = 'lg',
  surface = 'light',
  className,
}: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  surface?: 'light' | 'dark';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);
  return (
    <>
      <SiteButton
        variant={variant}
        size={size}
        surface={surface}
        arrow={false}
        className={className}
        onClick={() => {
          setRequested(true);
          setOpen(true);
        }}
      >
        Join the pilot
      </SiteButton>
      {requested && <JoinPilotDialog open={open} setOpen={setOpen} />}
    </>
  );
}
