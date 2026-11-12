'use client';

import { DotsHorizontal } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';
import { Dropdown } from '@/components/base/dropdown/dropdown';

export type MoreItem =
  | { id: string; label: string; href: string; download?: boolean; external?: boolean }
  | { id: string; label: string; onAction: () => void; disabled?: boolean };

/**
 * Secondary actions behind one "More" button, so each screen keeps a single
 * clear primary action. Links can download a file or open in a new tab.
 */
export function MoreMenu({ items, label = 'More actions' }: { items: MoreItem[]; label?: string }) {
  if (items.length === 0) return null;
  return (
    <Dropdown.Root>
      <Button color="secondary" size="md" iconLeading={DotsHorizontal} aria-label={label}>
        More
      </Button>
      <Dropdown.Popover placement="bottom end" className="w-60">
        <Dropdown.Menu
          aria-label={label}
          disabledKeys={items.flatMap((item) => ('disabled' in item && item.disabled === true ? [item.id] : []))}
          onAction={(key) => {
            const item = items.find((entry) => entry.id === key);
            if (item !== undefined && 'onAction' in item) item.onAction();
          }}
        >
          {items.map((item) =>
            'href' in item ? (
              <Dropdown.Item
                key={item.id}
                id={item.id}
                href={item.href}
                download={item.download === true ? '' : undefined}
                target={item.external === true ? '_blank' : undefined}
                rel={item.external === true ? 'noreferrer' : undefined}
                label={item.external === true ? `${item.label} (opens in a new tab)` : item.label}
              />
            ) : (
              <Dropdown.Item key={item.id} id={item.id} label={item.label} />
            ),
          )}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown.Root>
  );
}
