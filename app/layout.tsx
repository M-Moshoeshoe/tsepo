import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const plexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-sans' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono' });

export const metadata: Metadata = {
  title: 'Tšepo',
  description: 'Identity and spending rules for AI agents that pay, recorded on the XRP Ledger.',
};

/** The document for every page: fonts and the skip link. Live runs, toasts and the product shell are added by the (product) layout. */
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="min-h-screen bg-primary antialiased">
        <a
          href="#main"
          className="sr-only rounded-md bg-surface px-3 py-2 text-sm font-medium text-teal focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
