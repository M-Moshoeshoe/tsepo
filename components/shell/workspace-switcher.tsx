'use client';

import { ChevronSelectorVertical } from '@untitledui/icons';
import { usePathname } from 'next/navigation';
import { Button as AriaButton } from 'react-aria-components';
import { Dropdown } from '@/components/base/dropdown/dropdown';
import { WORKSPACE_ICONS, WORKSPACES, workspaceFor, type WorkspaceId } from './workspaces.ts';

function WorkspaceIcon({ id }: { id: WorkspaceId }) {
  const Icon = WORKSPACE_ICONS[id];
  return (
    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary ring-1 ring-secondary">
      <Icon className="size-5 text-fg-brand-primary" />
    </span>
  );
}

/**
 * Switches between the Business and Receiving exchange workspaces, like an
 * account switcher. Each workspace lists its pages, so any page is two clicks away.
 */
export function WorkspaceSwitcher() {
  const pathname = usePathname();
  const current = workspaceFor(pathname);
  return (
    <Dropdown.Root>
      <AriaButton
        aria-label={`Workspace: ${current.name}, ${current.type}. Switch workspace`}
        className="flex w-full items-center gap-3 rounded-lg p-2 text-left outline-focus-ring hover:bg-primary_hover focus-visible:outline-2"
      >
        <WorkspaceIcon id={current.id} />
        <span className="grid min-w-0 grow">
          <span className="truncate text-sm font-semibold text-primary">{current.name}</span>
          <span className="truncate text-xs text-tertiary">{current.type}</span>
        </span>
        <ChevronSelectorVertical className="size-4 shrink-0 text-fg-quaternary" aria-hidden />
      </AriaButton>
      <Dropdown.Popover placement="bottom start" className="w-80">
        <Dropdown.Menu aria-label="Workspaces and their pages" selectionMode="single" selectedKeys={[pathname]}>
          {Object.values(WORKSPACES).map((workspace) => (
            <Dropdown.Section key={workspace.id} aria-label={`${workspace.name} pages`} className="border-t border-secondary first:border-t-0">
              <Dropdown.SectionHeader className="grid gap-0.5 px-4 pt-3 pb-1">
                <span className="text-sm font-semibold text-primary">
                  {workspace.name} <span className="font-normal text-tertiary">({workspace.type})</span>
                </span>
                <span className="text-xs text-tertiary">{workspace.forWhom}</span>
              </Dropdown.SectionHeader>
              {workspace.nav.map((link) => (
                <Dropdown.Item key={link.href} id={link.href} href={link.href} icon={link.icon} label={link.label} textValue={`${workspace.name}: ${link.label}`} />
              ))}
            </Dropdown.Section>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}
