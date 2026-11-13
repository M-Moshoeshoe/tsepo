'use client';

import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { SlideoutMenu } from '@/components/application/slideout-menus/slideout-menu';

/**
 * The details panel used by every list: a side sheet on desktop, full width on
 * phones. It opens when the address names an item, so a link can open it;
 * closing it returns to the list with the same filters.
 */
export function DetailsSheet({
  label,
  closeHref,
  header,
  footer,
  children,
}: {
  /** The accessible name of the panel, such as "Payment details". */
  label: string;
  closeHref: string;
  header: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(true);

  return (
    <SlideoutMenu
      isOpen={open}
      isDismissable
      dialogLabel={label}
      // Applies to the overlay and the panel: keeps both above the sticky tabs and table headers.
      className="z-50"
      onOpenChange={(next) => {
        if (next) return;
        setOpen(false);
        router.replace(closeHref, { scroll: false });
      }}
    >
      {({ close }) => (
        <>
          <SlideoutMenu.Header onClose={close}>{header}</SlideoutMenu.Header>
          <SlideoutMenu.Content role="document" className="pb-6">
            {children}
          </SlideoutMenu.Content>
          {footer !== undefined && <SlideoutMenu.Footer>{footer}</SlideoutMenu.Footer>}
        </>
      )}
    </SlideoutMenu>
  );
}
