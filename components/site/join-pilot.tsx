'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Button } from '@/components/base/buttons/button';

// The dialog and its form load on the first press, so the landing page carries none of their code.
const JoinPilotDialog = dynamic(() => import('./join-pilot-dialog.tsx').then((module) => module.JoinPilotDialog));

/** "Join the pilot": a button that opens a short form in a dialog. */
export function JoinPilot({ className, size = 'xl', color = 'secondary' }: { className?: string; size?: 'md' | 'lg' | 'xl'; color?: 'primary' | 'secondary' }) {
  const [open, setOpen] = useState(false);
  const [requested, setRequested] = useState(false);
  return (
    <>
      <Button
        color={color}
        size={size}
        className={className}
        onClick={() => {
          setRequested(true);
          setOpen(true);
        }}
      >
        Join the pilot
      </Button>
      {requested && <JoinPilotDialog open={open} setOpen={setOpen} />}
    </>
  );
}
