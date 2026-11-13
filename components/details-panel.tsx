'use client';

import dynamic from 'next/dynamic';

/**
 * The details panel used by every list. The slide-out sheet loads only on a
 * page that opens it, so a list without an open item carries none of its code.
 */
export const DetailsPanel = dynamic(() => import('./details-sheet.tsx').then((module) => module.DetailsSheet));
