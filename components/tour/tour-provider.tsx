'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { parseTourParam, withTourParam } from '../../src/views/tour.ts';

interface TourState {
  open: boolean;
  /** The current step, from 0; undefined while the tour is closed. */
  step: number | undefined;
  /** Opens the tour, at a step or where it was left. */
  show: (step?: number) => void;
  goTo: (step: number) => void;
  close: () => void;
  toggle: () => void;
}

const TourContext = createContext<TourState | null>(null);

/** Set once the visitor has opened the tour or dismissed the prompt, so the first-visit prompt never returns. */
export const TOUR_SEEN_KEY = 'tsepo-tour-seen';

export function markTourSeen(): void {
  try {
    localStorage.setItem(TOUR_SEEN_KEY, '1');
  } catch {
    // Storage can be blocked; the prompt then simply shows again next visit.
  }
}

/** Whether this visitor has opened the tour or dismissed its offer before. */
export function seenTourBefore(): boolean {
  try {
    return localStorage.getItem(TOUR_SEEN_KEY) !== null;
  } catch {
    return false;
  }
}

/** The page address as it is now, path and query. */
function currentHref(): string {
  return `${window.location.pathname}${window.location.search}`;
}

/**
 * Whether the guided tour is open and on which step. The step lives in the
 * address (?tour=2), so a refresh or a shared link reopens it, and links into
 * the evidence carry it from page to page.
 */
export function TourProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const [step, setStep] = useState<number | undefined>(undefined);
  const lastStep = useRef<number>(0);
  const current = useRef<number | undefined>(undefined);
  current.current = step;

  // The address leads when it names a step (a shared link, a refresh, an evidence link).
  // When it names none but the tour is open, the step is written back into it.
  useEffect(() => {
    const fromUrl = parseTourParam(new URLSearchParams(search).get('tour'));
    if (fromUrl !== undefined && fromUrl !== current.current) {
      setStep(fromUrl);
      markTourSeen();
    } else if (fromUrl === undefined && current.current !== undefined) {
      window.history.replaceState(window.history.state, '', withTourParam(currentHref(), current.current));
    }
  }, [pathname, search]);

  useEffect(() => {
    if (step !== undefined) lastStep.current = step;
    const wanted = withTourParam(currentHref(), step);
    if (wanted !== currentHref()) window.history.replaceState(window.history.state, '', wanted);
  }, [step]);

  const show = useCallback((at?: number) => {
    markTourSeen();
    setStep(at ?? lastStep.current);
  }, []);
  const goTo = useCallback((at: number) => {
    setStep(at);
  }, []);
  const close = useCallback(() => {
    setStep(undefined);
  }, []);
  const toggle = useCallback(() => {
    if (current.current === undefined) show();
    else close();
  }, [show, close]);

  const value = useMemo(() => ({ open: step !== undefined, step, show, goTo, close, toggle }), [step, show, goTo, close, toggle]);
  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourState {
  const value = useContext(TourContext);
  if (value === null) throw new Error('useTour must be used inside TourProvider');
  return value;
}
