import type { ThusoExample } from '../../../app/_data/landing.ts';
import { ASSISTANT_NAME } from '../../../src/views/assistant.ts';
import { AssistantNote } from '../../assistant-note.tsx';
import { ThusoAvatar } from '../../thuso-avatar.tsx';
import { SITE_WIDTH } from '../site-chrome.tsx';
import { FragmentPanel } from '../section.tsx';

/** The fields Thuso read, as small chips: the payee, the amount and the reference of each payment. */
function ReadChips({ example }: { example: ThusoExample }) {
  return (
    <ul aria-label="What Thuso read" className="flex flex-wrap gap-2">
      {example.intents.map((intent) => (
        <li key={intent.reference} className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs text-secondary shadow-xs ring-1 ring-secondary">
          <ThusoAvatar className="size-3.5" />
          <span>
            {intent.payee}, <span className="font-mono">{intent.amount} RLUSD</span>, <span className="font-mono">{intent.reference}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Thuso, the agent's AI step: it reads and explains. The rules and the ledger decide. */
export function MeetThuso({ example }: { example: ThusoExample | undefined }) {
  return (
    <section id="thuso" aria-labelledby="thuso-title" className="scroll-mt-4">
      <div className={`${SITE_WIDTH} grid gap-10 py-10 md:py-12`}>
        <div className="grid gap-10 border-t border-secondary pt-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
          {/*
            The mascot stands behind the text: the drawing's empty sky slides up under the last lines, so the
            words sit on it and Thuso shakes hands below them. The panel matches the drawing's paper colour.
          */}
          <div className="grid content-start overflow-hidden rounded-2xl bg-[#fdfdfd] ring-1 ring-secondary">
            <div className="relative z-10 grid gap-4 p-6 md:p-8">
              <h2 id="thuso-title" className="text-display-xs font-medium text-primary md:text-display-md">
                Meet {ASSISTANT_NAME}.
              </h2>
              <p className="text-lg text-tertiary">Thuso, the agent’s AI, reads each instruction and explains what happened in plain words.</p>
              <p className="text-lg text-tertiary">The spending rules and the XRP Ledger decide every payment, and Thuso never does.</p>
            </div>
            <img
              src="/thuso-handshake.webp"
              alt="Thuso, the mascot, shaking hands with a business owner."
              width={1000}
              height={794}
              loading="lazy"
              decoding="async"
              className="-mt-[20%] block h-auto w-full"
            />
          </div>
          {example === undefined ? (
            <FragmentPanel>
              <p className="text-md text-tertiary">Thuso’s example appears here once the tour’s split payment story has run on Testnet.</p>
            </FragmentPanel>
          ) : (
            <FragmentPanel className="gap-4">
              <p className="text-xs font-semibold text-tertiary">A real instruction from the tour, as the agent received it</p>
              <blockquote className="rounded-xl bg-primary px-4 py-3 text-sm whitespace-pre-wrap text-primary shadow-xs ring-1 ring-secondary">
                {example.instruction}
              </blockquote>
              <ReadChips example={example} />
              <div className="rounded-xl bg-primary p-1 shadow-xs ring-1 ring-secondary">
                <AssistantNote>{example.note}</AssistantNote>
              </div>
            </FragmentPanel>
          )}
        </div>
      </div>
    </section>
  );
}
