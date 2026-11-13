'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { parseTourParam, withTourParam } from '../../src/views/tour.ts';

/** Walk through it yourself, step by step, or let the story play on its own. */
export type TourMode = 'walk' | 'story';

interface TourState {
  open: boolean;
  /** The current step, from 0; undefined while the tour is closed. */
  step: number | undefined;
  mode: TourMode;
  /** True while "Play the story" is moving on by itself. */
  playing: boolean;
  /** Opens the walkthrough, at a step or where it was left. */
  show: (step?: number) => void;
  /** Starts "Play the story" from the welcome. */
  playStory: () => void;
  pause: () => void;
  resume: () => void;
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
  const [mode, setMode] = useState<TourMode>('walk');
  const [playing, setPlaying] = useState(false);
  // The control that opened the tour gets focus back when it closes.
  const opener = useRef<HTMLElement | null>(null);
  const remember = (): void => {
    const active = document.activeElement;
    if (active instanceof HTMLElement && active.closest('#guided-tour') === null) opener.current = active;
  };
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
    remember();
    setMode('walk');
    setPlaying(false);
    setStep(at ?? lastStep.current);
  }, []);
  const playStory = useCallback(() => {
    markTourSeen();
    remember();
    setMode('story');
    setPlaying(true);
    setStep(0);
  }, []);
  const pause = useCallback(() => {
    setPlaying(false);
  }, []);
  const resume = useCallback(() => {
    setPlaying(true);
  }, []);
  const goTo = useCallback((at: number) => {
    setStep(at);
  }, []);
  const close = useCallback(() => {
    setStep(undefined);
    setMode('walk');
    setPlaying(false);
  }, []);

  // Once the tour has closed and its card is gone, focus goes back to the control that opened it.
  useEffect(() => {
    if (step !== undefined) return;
    const back = opener.current;
    opener.current = null;
    if (back?.isConnected === true) back.focus();
  }, [step]);
  const toggle = useCallback(() => {
    if (current.current === undefined) show();
    else close();
  }, [show, close]);

  const value = useMemo(
    () => ({ open: step !== undefined, step, mode, playing, show, playStory, pause, resume, goTo, close, toggle }),
    [step, mode, playing, show, playStory, pause, resume, goTo, close, toggle],
  );
  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourState {
  const value = useContext(TourContext);
  if (value === null) throw new Error('useTour must be used inside TourProvider');
  return value;
}
