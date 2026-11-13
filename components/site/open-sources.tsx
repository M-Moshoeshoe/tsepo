'use client';

import { useEffect } from 'react';

/**
 * Opens the collapsed Sources list when a footnote is followed, so the
 * browser can land on the source. It opens before the jump, when a footnote
 * is clicked, and also on arrival, when the address already names a source.
 */
export function OpenSourcesOnFootnote({ listId }: { listId: string }) {
  useEffect(() => {
    const list = document.getElementById(listId);
    if (!(list instanceof HTMLDetailsElement)) return undefined;

    const reveal = (hash: string): void => {
      if (!hash.startsWith('#source-')) return;
      list.open = true;
      document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'center' });
    };
    const onClick = (event: MouseEvent): void => {
      const link = event.target instanceof Element ? event.target.closest('a[href^="#source-"]') : null;
      if (link !== null) list.open = true;
    };

    reveal(window.location.hash);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
    };
  }, [listId]);
  return null;
}
