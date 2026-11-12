'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

interface TourState {
  open: boolean;
  show: () => void;
  close: () => void;
  toggle: () => void;
}

const TourContext = createContext<TourState | null>(null);

/** Whether the guided tour panel is open. Any page can open it, for example from an empty state. */
export function TourProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  // A link with ?tour, such as "Take the guided tour" on the landing page, opens the panel on arrival.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).has('tour')) setOpen(true);
  }, []);
  const show = useCallback(() => {
    setOpen(true);
  }, []);
  const close = useCallback(() => {
    setOpen(false);
  }, []);
  const toggle = useCallback(() => {
    setOpen((current) => !current);
  }, []);
  const value = useMemo(() => ({ open, show, close, toggle }), [open, show, close, toggle]);
  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour(): TourState {
  const value = useContext(TourContext);
  if (value === null) throw new Error('useTour must be used inside TourProvider');
  return value;
}
