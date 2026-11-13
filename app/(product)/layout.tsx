import type { ReactNode } from 'react';
import { RunProvider } from '../../components/run-provider.tsx';
import { AppShell } from '../../components/shell/app-shell.tsx';
import { ToastProvider } from '../../components/toast-provider.tsx';

/**
 * Every Business and Exchange page shares the product shell, live runs and
 * toasts. The public pages need none of them, so they load none of that code.
 */
export default function ProductLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <RunProvider>
        <AppShell>{children}</AppShell>
      </RunProvider>
    </ToastProvider>
  );
}
