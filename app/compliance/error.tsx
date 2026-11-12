'use client';

import { PageError } from '../../components/page-states.tsx';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return <PageError title="Demo Exchange, agent lane" retry={reset} />;
}
