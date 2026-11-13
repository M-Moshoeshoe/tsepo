import { Clock } from '@untitledui/icons';
import type { InboxItem } from '../../src/schedule/schedule.ts';
import { formatSast } from '../../src/views/status.ts';

/** The instructions waiting for the next automatic run, oldest first, and when that run is. */
export function InboxWaiting({ items, line }: { items: InboxItem[]; line: string }) {
  return (
    <section aria-labelledby="inbox-title" className="grid gap-3 rounded-xl p-5 ring-1 ring-secondary ring-inset lg:p-6">
      <h2 id="inbox-title" className="text-md font-semibold text-primary">
        Inbox for the next automatic run
      </h2>
      <p className="flex items-start gap-2 text-sm text-secondary">
        <Clock className="mt-0.5 size-4 shrink-0 text-fg-quaternary" aria-hidden />
        {line}
      </p>
      {items.length > 0 && (
        <ol className="grid gap-2">
          {items.map((item) => (
            <li key={item.id} className="grid gap-0.5 rounded-lg bg-secondary px-3 py-2.5 text-sm">
              <span className="whitespace-pre-wrap text-primary">{item.text}</span>
              <span className="text-xs text-tertiary">Added {formatSast(item.addedAt)}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
