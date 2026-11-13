'use client';

import { useEffect, useRef, useState } from 'react';
import type { Box } from '../../src/views/tour-stage.ts';

/** Space left around the lit element inside the ring. */
const PAD = 6;

function same(a: Box | undefined, b: Box | undefined): boolean {
  return a?.top === b?.top && a?.left === b?.left && a?.width === b?.width && a?.height === b?.height;
}

/**
 * Dims the page and lights the element the tour explains: the record the
 * highlight found (marked .tour-highlight), with the brand ring around it.
 * Purely visual: it never takes clicks or focus, so nothing is trapped behind
 * it. It reports where the lit element is, so the card can sit beside it.
 */
export function Spotlight({ onTarget }: { onTarget: (box: Box | undefined) => void }) {
  const [box, setBox] = useState<Box | undefined>(undefined);
  const last = useRef<Box | undefined>(undefined);

  useEffect(() => {
    let frame = 0;
    const measure = (): void => {
      const element = document.querySelector<HTMLElement>('.tour-highlight');
      let next: Box | undefined;
      if (element !== null && element.isConnected) {
        const rect = element.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          next = {
            top: Math.round(rect.top - PAD),
            left: Math.round(rect.left - PAD),
            width: Math.round(rect.width + PAD * 2),
            height: Math.round(rect.height + PAD * 2),
          };
        }
      }
      if (!same(next, last.current)) {
        last.current = next;
        setBox(next);
        onTarget(next);
      }
      frame = window.requestAnimationFrame(measure);
    };
    frame = window.requestAnimationFrame(measure);
    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [onTarget]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60]">
      {box === undefined ? (
        <div className="absolute inset-0 bg-black/40" />
      ) : (
        <div
          data-testid="spotlight"
          className="absolute rounded-xl shadow-[0_0_0_9999px_rgba(10,13,18,0.45)] ring-2 ring-brand ring-offset-2 ring-offset-white"
          style={{ top: box.top, left: box.left, width: box.width, height: box.height }}
        />
      )}
    </div>
  );
}
