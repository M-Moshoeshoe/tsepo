import { noteNumber, type Source } from '../../src/views/sources.ts';
import { SITE_WIDTH } from './site-chrome.tsx';

/** Small superscript footnote numbers that link to the page's Sources list. */
export function Ref({ notes, sources }: { notes: readonly Source[]; sources: readonly Source[] }) {
  return (
    <sup className="ml-0.5 inline-flex gap-1 text-[0.7em] leading-none">
      {sources.map((source) => {
        const number = noteNumber(notes, source);
        return (
          <a
            key={source.href}
            href={`#source-${String(number)}`}
            aria-label={`Source ${String(number)}`}
            className="rounded-sm font-semibold text-brand-secondary no-underline outline-focus-ring hover:underline focus-visible:outline-2"
          >
            {number}
          </a>
        );
      })}
    </sup>
  );
}

/** The short Sources list at the bottom of a page: title, publisher, date and link, numbered as the footnotes are. */
export function SourceList({ notes, inPage = false }: { notes: readonly Source[]; inPage?: boolean }) {
  return (
    <section aria-labelledby="sources-title" className={inPage ? 'border-t border-secondary py-10' : `${SITE_WIDTH} border-t border-secondary py-10`}>
      <h2 id="sources-title" className="text-sm font-semibold text-primary">
        Sources
      </h2>
      <ol className="mt-3 grid gap-1.5 text-xs text-tertiary md:grid-cols-2 md:gap-x-10">
        {notes.map((source, index) => (
          <li key={source.href} id={`source-${String(index + 1)}`} className="flex scroll-mt-24 gap-2">
            <span className="w-4 shrink-0 text-right tabular-nums">{index + 1}.</span>
            <span>
              <a
                href={source.href}
                target="_blank"
                rel="noreferrer"
                className="rounded-sm font-medium text-secondary underline underline-offset-4 outline-focus-ring hover:text-primary focus-visible:outline-2"
              >
                {source.title}
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              . {source.publisher}, {source.date}.
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
