import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import type { ReactNode } from 'react';
import { RunProvider } from '../components/run-provider.tsx';
import { AppShell } from '../components/shell/app-shell.tsx';
import { ToastProvider } from '../components/toast-provider.tsx';
import './globals.css';

const plexSans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-plex-sans' });
const plexMono = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex-mono' });

export const metadata: Metadata = {
  title: 'Tšepo',
  description: 'Identity and authority for AI agents that pay, recorded on the XRP Ledger.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="min-h-screen antialiased">
        <a
          href="#main"
          className="sr-only rounded-md bg-surface px-3 py-2 text-sm font-medium text-teal focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
        >
          Skip to content
        </a>
        <ToastProvider>
          <RunProvider>
            <AppShell>{children}</AppShell>
          </RunProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
