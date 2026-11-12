'use client';

import { useRouter } from 'next/navigation';
import { useSyncExternalStore, type ReactNode } from 'react';
import { Sheet } from '../ui/sheet.tsx';

/** Below the desktop breakpoint the details open as a bottom sheet instead of a side panel. */
const NARROW = '(max-width: 1023px)';

function subscribe(onChange: () => void): () => void {
  const query = window.matchMedia(NARROW);
  query.addEventListener('change', onChange);
  return () => {
    query.removeEventListener('change', onChange);
  };
}

function useNarrowScreen(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(NARROW).matches,
    () => false,
  );
}

/** Opens the details of the chosen entry as a bottom sheet on phones. Closing it removes the choice from the address. */
export function DetailSheet({ open, closeHref, title, children }: { open: boolean; closeHref: string; title: string; children: ReactNode }) {
  const narrow = useNarrowScreen();
  const router = useRouter();
  return (
    <Sheet
      open={open && narrow}
      title={title}
      onOpenChange={(next) => {
        if (!next) router.replace(closeHref, { scroll: false });
      }}
    >
      {children}
    </Sheet>
  );
}
