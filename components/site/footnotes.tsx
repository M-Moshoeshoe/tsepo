import { LinkExternal01 } from '@untitledui/icons';
import { noteNumber, type Source } from '../../src/views/sources.ts';
import { OpenSourcesOnFootnote } from './open-sources.tsx';
import { SITE_WIDTH } from './site-chrome.tsx';

const SOURCES_ID = 'sources';

/**
 * Small superscript footnote numbers. Each links to its source in the
 * page's Sources list, and carries an id so the source can link back.
 */
export function Ref({ notes, sources }: { notes: readonly Source[]; sources: readonly Source[] }) {
  return (
    <sup className="ml-0.5 inline-flex gap-1 text-[0.7em] leading-none">
      {sources.map((source) => {
        const number = noteNumber(notes, source);
        return (
          <a
            key={source.href}
            id={`ref-${String(number)}`}
            href={`#source-${String(number)}`}
            aria-label={`Source ${String(number)}`}
            className="scroll-mt-28 rounded-sm font-semibold text-brand-secondary no-underline outline-focus-ring hover:underline focus-visible:outline-2"
          >
            {number}
          </a>
        );
      })}
    </sup>
  );
}

/**
 * The page's sources, collapsed under "Sources (8)": title, publisher, date
 * and link, numbered once, each with a way back to the text. Clicking a
 * footnote opens the list and lands on its source.
 */
export function SourceList({ notes, inPage = false }: { notes: readonly Source[]; inPage?: boolean }) {
  return (
    <details id={SOURCES_ID} className={`group ${inPage ? '' : SITE_WIDTH} border-t border-secondary py-6`}>
      <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-sm text-sm font-semibold text-primary outline-focus-ring focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
        <span aria-hidden className="text-tertiary transition-transform duration-150 group-open:rotate-90 motion-reduce:transition-none">
          ›
        </span>
        Sources ({notes.length})
      </summary>
      <ol className="mt-4 grid gap-2 text-xs text-tertiary md:grid-cols-2 md:gap-x-10">
        {notes.map((source, index) => {
          const number = String(index + 1);
          return (
            <li key={source.href} id={`source-${number}`} className="flex scroll-mt-28 gap-2">
              <span className="w-4 shrink-0 text-right tabular-nums">{number}</span>
              <span>
                <a
                  href={source.href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-sm font-medium text-secondary underline underline-offset-4 outline-focus-ring hover:text-primary focus-visible:outline-2"
                >
                  {source.title}
                  <LinkExternal01 className="ml-1 inline size-3 align-[-1px]" aria-hidden />
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>{' '}
                {source.publisher}, {source.date}.{' '}
                <a
                  href={`#ref-${number}`}
                  className="rounded-sm whitespace-nowrap text-brand-secondary outline-focus-ring hover:underline focus-visible:outline-2"
                >
                  Back to the text
                </a>
              </span>
            </li>
          );
        })}
      </ol>
      <OpenSourcesOnFootnote listId={SOURCES_ID} />
    </details>
  );
}
