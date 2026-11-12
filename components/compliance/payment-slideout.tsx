'use client';

import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { SlideoutMenu } from '@/components/application/slideout-menus/slideout-menu';

/**
 * The payment details slideout. It opens when the address names a payment;
 * closing it returns to the list with the same filter.
 */
export function PaymentSlideout({
  closeHref,
  header,
  footer,
  children,
}: {
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
      dialogLabel="Payment details"
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
