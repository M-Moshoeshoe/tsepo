'use client';

import { X } from 'lucide-react';
import { Dialog as DialogPrimitive } from 'radix-ui';
import type { ReactNode } from 'react';
import { Button } from './button.tsx';

/**
 * A panel that slides up from the bottom of a phone screen. Built on the
 * Radix dialog, so focus moves into the panel, stays there while it is open,
 * and returns to where it was when it closes.
 */
export function Sheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/40" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="sheet-up fixed inset-x-0 bottom-0 z-50 flex max-h-[88vh] flex-col rounded-t-md border-t border-border bg-surface"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <DialogPrimitive.Title className="text-base font-semibold text-ink">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Close asChild>
              <Button variant="secondary" size="sm">
                <X aria-hidden />
                Close
              </Button>
            </DialogPrimitive.Close>
          </div>
          <div className="overflow-y-auto px-4 py-4">{children}</div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
