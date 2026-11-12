'use client';

import { Tabs } from '@/components/application/tabs/tabs';
import { DESK_FILTERS, type DeskFilter } from '../../src/views/desk.ts';
import { deskHref } from '../../app/compliance/desk-href.ts';

/** Filter tabs with a count on each. Each tab is a link, so the filter lives in the address. */
export function DeskTabs({ counts, filter, earlier }: { counts: Record<DeskFilter, number>; filter: DeskFilter; earlier: boolean }) {
  return (
    <Tabs selectedKey={filter} className="min-w-0">
      <Tabs.List type="underline" size="sm" aria-label="Filter payments" className="overflow-x-auto">
        {DESK_FILTERS.map((option) => (
          <Tabs.Item
            key={option.id}
            id={option.id}
            href={deskHref({ filter: option.id, earlier })}
            routerOptions={{ scroll: false }}
            label={option.label}
            badge={String(counts[option.id])}
          />
        ))}
      </Tabs.List>
    </Tabs>
  );
}
