import type { ReactNode } from 'react';
import { AppShell } from '../../components/shell/app-shell.tsx';

/** Every Business and Exchange page shares the product shell. */
export default function ProductLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
