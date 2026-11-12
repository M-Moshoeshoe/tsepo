'use client';

import { ChevronDown, PlayCircle, RefreshCcw01 } from '@untitledui/icons';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/base/buttons/button';
import { Dropdown } from '@/components/base/dropdown/dropdown';
import type { RunKind } from '../../src/demo/events.ts';
import { useRun } from '../run-provider.tsx';

const SCENARIOS: { kind: Extract<RunKind, `scenario-${string}`>; label: string }[] = [
  { kind: 'scenario-1', label: 'Scenario 1: Unknown agent' },
  { kind: 'scenario-2', label: 'Scenario 2: Verified agent' },
  { kind: 'scenario-3', label: 'Scenario 3: Split payments' },
  { kind: 'scenario-4', label: 'Scenario 4: Revoke' },
];

function pageTitle(pathname: string): string {
  if (pathname.startsWith('/agent')) return 'Agent';
  if (pathname.startsWith('/compliance')) return 'Compliance desk';
  return 'Home';
}

/** The page title, and the demo actions on the right. When the demo is locked, the actions ask for the code first. */
export function AppHeader({ onUnlock }: { onUnlock: () => void }) {
  const pathname = usePathname();
  const { accessCode, busy, start } = useRun();
  const locked = accessCode === undefined;

  return (
    <header className="flex flex-wrap items-center gap-x-6 gap-y-3 px-4 pt-6 pb-5 lg:px-8 lg:pt-8">
      <h1 className="text-display-xs font-semibold text-primary">{pageTitle(pathname)}</h1>
      <div className="ml-auto flex items-center gap-3">
        <Button
          color="secondary"
          size="md"
          iconLeading={RefreshCcw01}
          isDisabled={busy}
          onClick={() => {
            if (locked) onUnlock();
            else start({ kind: 'reset' }, 'Reset demo');
          }}
        >
          Reset
        </Button>
        {locked ? (
          <Button color="primary" size="md" iconLeading={PlayCircle} onClick={onUnlock}>
            Run scenario
          </Button>
        ) : (
          <Dropdown.Root>
            <Button color="primary" size="md" iconLeading={PlayCircle} iconTrailing={ChevronDown} isDisabled={busy}>
              Run scenario
            </Button>
            <Dropdown.Popover placement="bottom end" className="w-72">
              {/* React Aria names the menu after its trigger, Run scenario. */}
              <Dropdown.Menu
                onAction={(key) => {
                  const scenario = SCENARIOS.find((item) => item.kind === key);
                  if (scenario !== undefined) start({ kind: scenario.kind }, scenario.label);
                }}
              >
                {SCENARIOS.map((scenario) => (
                  <Dropdown.Item key={scenario.kind} id={scenario.kind} label={scenario.label} />
                ))}
              </Dropdown.Menu>
            </Dropdown.Popover>
          </Dropdown.Root>
        )}
      </div>
    </header>
  );
}
