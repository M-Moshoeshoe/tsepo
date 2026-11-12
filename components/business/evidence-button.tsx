'use client';

import { Download01 } from '@untitledui/icons';
import { Button } from '@/components/base/buttons/button';

/**
 * Downloads one payment's evidence file. A client component, because the
 * Untitled UI button takes its icon as a component, which cannot cross from a
 * server component. The download attribute keeps the router from treating the
 * file as a page.
 */
export function EvidenceButton({ paymentId }: { paymentId: string }) {
  return (
    <Button href={`/business/payments/${paymentId}/evidence`} download="" color="secondary" size="md" iconLeading={Download01}>
      Download evidence
    </Button>
  );
}
