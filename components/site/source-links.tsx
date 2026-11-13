import { sourceLabel, type Source } from '../../src/views/sources.ts';

/** "Source: Visa, 9 September 2026", each link opening in a new tab. Used where a footnote list would be out of place, such as one FAQ answer. */
export function SourceLinks({ sources, className = 'text-xs text-tertiary' }: { sources: readonly Source[]; className?: string }) {
  return (
    <p className={className}>
      {sources.length === 1 ? 'Source' : 'Sources'}:{' '}
      {sources.map((source, index) => (
        <span key={source.href}>
          {index > 0 && '; '}
          <a
            href={source.href}
            target="_blank"
            rel="noreferrer"
            className="rounded-sm font-medium text-brand-secondary underline underline-offset-4 outline-focus-ring hover:text-brand-secondary_hover focus-visible:outline-2"
          >
            {sourceLabel(source)}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </span>
      ))}
    </p>
  );
}
