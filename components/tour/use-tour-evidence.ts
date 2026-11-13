'use client';

import { useEffect, useState } from 'react';
import { TourEvidenceSchema, type TourEvidence } from '../../src/views/tour.ts';
import { useRun } from '../run-provider.tsx';

export type EvidenceState = { status: 'loading' } | { status: 'ready'; evidence: TourEvidence } | { status: 'error' };

/**
 * The tour's evidence links and latest runs, read while the tour is open and
 * again whenever a live step finishes, so "Show me the evidence" opens the
 * record that run just made. The response is checked before it is used.
 */
export function useTourEvidence(open: boolean): EvidenceState {
  const { busy } = useRun();
  const [state, setState] = useState<EvidenceState>({ status: 'loading' });

  useEffect(() => {
    if (!open || busy) return;
    // A newer read, or the tour closing, cancels this one, so an old answer never replaces a new one.
    const controller = new AbortController();
    void (async () => {
      try {
        const response = await fetch('/api/tour', { cache: 'no-store', signal: controller.signal });
        const parsed = TourEvidenceSchema.safeParse(await response.json());
        setState(response.ok && parsed.success ? { status: 'ready', evidence: parsed.data } : { status: 'error' });
      } catch {
        if (!controller.signal.aborted) setState({ status: 'error' });
      }
    })();
    return () => {
      controller.abort();
    };
  }, [open, busy]);

  return state;
}
