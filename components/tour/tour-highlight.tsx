'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

/** How long to wait for the record to appear: a details panel opens, and the page streams in from the ledger. */
const WAIT_MS = 8000;
const POLL_MS = 150;

/** The highlight names the tour may ask for, matching data-tour-target on the pages. */
const TARGETS = new Set(['decision', 'travel-rule', 'explorer', 'agent-status', 'allowance']);

/**
 * When the address says ?highlight=<target>, finds that element, scrolls it
 * into view, rings it in the brand colour (a ring, so it stays visible with
 * reduced motion) and moves focus to it, so the evidence is the first thing
 * seen and heard.
 */
export function TourHighlight() {
  const pathname = usePathname();
  const target = useSearchParams().get('highlight');

  useEffect(() => {
    if (target === null || !TARGETS.has(target)) return;
    const started = Date.now();
    let marked: HTMLElement | undefined;
    const timer = setInterval(() => {
      // The newest match: a details panel renders after the page underneath it.
      const found = [...document.querySelectorAll<HTMLElement>(`[data-tour-target="${target}"]`)].at(-1);
      if (found === undefined) {
        if (Date.now() - started > WAIT_MS) clearInterval(timer);
        return;
      }
      clearInterval(timer);
      marked = found;
      // Let an opening panel settle, then take focus after its own focus handling.
      setTimeout(() => {
        if (!found.isConnected) return;
        if (!found.hasAttribute('tabindex')) found.setAttribute('tabindex', '-1');
        found.classList.add('tour-highlight');
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        found.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' });
        found.focus({ preventScroll: true });
      }, 400);
    }, POLL_MS);
    return () => {
      clearInterval(timer);
      marked?.classList.remove('tour-highlight');
    };
  }, [pathname, target]);

  return null;
}
