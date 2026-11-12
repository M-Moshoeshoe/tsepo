'use client';

import { Inbox01 } from '@untitledui/icons';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/application/empty-state/empty-state';

/**
 * What to show when there is nothing yet, and what to do next. A client
 * component: the Untitled UI empty state takes an icon component, which
 * cannot be passed from a server component.
 */
export function EmptyMessage({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <EmptyState size="sm" className="py-10">
      <EmptyState.Header>
        <EmptyState.FeaturedIcon icon={Inbox01} color="gray" theme="light" />
      </EmptyState.Header>
      <EmptyState.Content>
        <EmptyState.Title>{title}</EmptyState.Title>
        {children !== undefined && <EmptyState.Description>{children}</EmptyState.Description>}
      </EmptyState.Content>
      {action !== undefined && <EmptyState.Footer>{action}</EmptyState.Footer>}
    </EmptyState>
  );
}
