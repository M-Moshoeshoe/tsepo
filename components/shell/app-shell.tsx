'use client';

import { useCallback, useState, type ReactNode } from 'react';
import { MobileNavigationHeader } from '@/components/application/app-navigation/base-components/mobile-header';
import { RouteProvider } from '@/providers/router-provider';
import { useRun } from '../run-provider.tsx';
import { TourHighlight } from '../tour/tour-highlight.tsx';
import { TourPanel } from '../tour/tour-panel.tsx';
import { TourPrompt } from '../tour/tour-prompt.tsx';
import { TourProvider } from '../tour/tour-provider.tsx';
import { AccessCodeDialog } from './access-code-dialog.tsx';
import { AppFooter } from './app-footer.tsx';
import { AppHeader } from './app-header.tsx';
import { LiveActionsProvider } from './live-actions.tsx';
import { RunResult } from './run-result.tsx';
import { SidebarContent, WorkspaceBrand } from './sidebar.tsx';

/** Sidebar width in pixels, shared by the fixed sidebar and the space it leaves. */
const SIDEBAR_WIDTH = 248;

/**
 * The page column. The tour panel lays over it rather than narrowing it, so
 * headers and charts keep their layout; when the tour highlights a record the
 * panel would cover, the highlight makes room (see TourHighlight).
 */
function PageColumn({ children }: { children: ReactNode }) {
  return (
    <div data-page-column className="flex min-w-0 flex-col lg:pl-62">
      <AppHeader />
      <RunResult />
      <main id="main" className="min-w-0 px-4 pt-4 lg:px-8">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}

/**
 * The product frame: a fixed sidebar on desktop that becomes a slideout menu
 * on phones, the header, the live run progress, the page, the footer and the
 * guided tour panel.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { saveAccessCode } = useRun();
  const [askingForCode, setAskingForCode] = useState(false);
  const unlock = useCallback(() => {
    setAskingForCode(true);
  }, []);

  return (
    <RouteProvider>
      <TourProvider>
        <LiveActionsProvider onUnlock={unlock}>
          <div className="min-h-dvh bg-primary">
            <MobileNavigationHeader logo={<WorkspaceBrand />}>
              <SidebarContent />
            </MobileNavigationHeader>

            <aside aria-label="Workspace and pages" className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:flex" style={{ width: SIDEBAR_WIDTH }}>
              <SidebarContent />
            </aside>

            <PageColumn>{children}</PageColumn>

            <TourPanel />
            <TourPrompt />
            <TourHighlight />
            <AccessCodeDialog isOpen={askingForCode} onOpenChange={setAskingForCode} onSave={saveAccessCode} />
          </div>
        </LiveActionsProvider>
      </TourProvider>
    </RouteProvider>
  );
}
