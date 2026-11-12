'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { MobileNavigationHeader } from '@/components/application/app-navigation/base-components/mobile-header';
import { RouteProvider } from '@/providers/router-provider';
import { useRun } from '../run-provider.tsx';
import { AccessCodeDialog } from './access-code-dialog.tsx';
import { AppFooter } from './app-footer.tsx';
import { AppHeader } from './app-header.tsx';
import { Brand } from './brand.tsx';
import { DemoActionsProvider } from './demo-actions.tsx';
import { RunResult } from './run-result.tsx';
import { SidebarContent } from './sidebar.tsx';

/** Sidebar width in pixels, shared by the fixed sidebar and the space it leaves. */
const SIDEBAR_WIDTH = 248;

/**
 * The application frame: a fixed sidebar on desktop that becomes a slideout
 * menu on phones, the application header, the run progress and result, the
 * page, and the footer.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { saveAccessCode } = useRun();
  const [askingForCode, setAskingForCode] = useState(false);
  const unlock = useCallback(() => {
    setAskingForCode(true);
  }, []);

  return (
    <RouteProvider>
      <DemoActionsProvider onUnlock={unlock}>
        <div className="min-h-dvh bg-primary">
          <MobileNavigationHeader logo={<Brand />}>
            <SidebarContent onUnlock={unlock} />
          </MobileNavigationHeader>

          <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex" style={{ width: SIDEBAR_WIDTH }}>
            <SidebarContent onUnlock={unlock} />
          </aside>

          <div className="flex min-w-0 flex-col lg:pl-62">
            <AppHeader />
            <RunResult />
            <main id="main" className="min-w-0 px-4 pt-4 lg:px-8">
              {children}
            </main>
            <AppFooter />
          </div>

          <AccessCodeDialog isOpen={askingForCode} onOpenChange={setAskingForCode} onSave={saveAccessCode} />
        </div>
      </DemoActionsProvider>
    </RouteProvider>
  );
}
