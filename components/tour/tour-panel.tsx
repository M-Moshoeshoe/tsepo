'use client';

import { ArrowLeft, ArrowRight, CheckCircle, PlayCircle, RefreshCcw01, X } from '@untitledui/icons';
import { useEffect, useRef, useState } from 'react';
import { ProgressBarBase } from '@/components/base/progress-indicators/progress-indicators';
import { Button } from '@/components/base/buttons/button';
import { cx } from '@/utils/cx';
import type { DemoEvent } from '../../src/demo/events.ts';
import { CFO_QUESTIONS, LAST_STEP, stepLabel, TOUR_PURPOSE, TOUR_STEPS, tryItHref, type LiveStep } from '../../src/views/tour.ts';
import { AssistantNote } from '../assistant-note.tsx';
import { useRun } from '../run-provider.tsx';
import { AccessCodeForm } from '../shell/access-code-dialog.tsx';
import { RESTORE_LABEL, useLiveActions } from '../shell/live-actions.tsx';
import { useTour } from './tour-provider.tsx';
import { useTourEvidence, type EvidenceState } from './use-tour-evidence.ts';

/** How long to wait before trying again when another visitor's step is running, and how often. */
const RETRY_MS = 5000;
const MAX_RETRIES = 12;

function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('grid gap-3', className)}>{children}</div>;
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  const { accessCode, saveAccessCode, forgetAccessCode, busy } = useRun();
  return (
    <Section>
      <p className="text-md text-primary">{TOUR_PURPOSE}</p>
      <ul className="grid gap-2 text-sm text-secondary">
        <li>
          <span className="font-semibold text-primary">Business:</span> Lesedi Design Studio runs the agent and sets the spending rules it
          cannot break.
        </li>
        <li>
          <span className="font-semibold text-primary">Receiving exchange:</span> where Naledi and other recipients hold their accounts. It
          accepts payments only from verified agents.
        </li>
      </ul>
      {accessCode === undefined ? (
        <section aria-labelledby="tour-access" className="grid gap-3 rounded-lg bg-secondary p-4">
          <h3 id="tour-access" className="text-sm font-semibold text-primary">
            The access code
          </h3>
          <p className="text-sm text-tertiary">
            Live steps move test funds, so they need the access code from the submission. No code? You can still see the latest live run
            of each step.
          </p>
          <AccessCodeForm onSave={saveAccessCode} />
          <Button color="link-color" size="sm" onClick={onNext} className="justify-self-start">
            Skip, and see the latest runs
          </Button>
        </section>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-secondary px-3 py-2.5 text-sm">
          <span className="flex items-center gap-2 font-medium text-secondary">
            <span className="size-2 rounded-full bg-fg-success-secondary" aria-hidden />
            Live steps unlocked
          </span>
          <Button color="link-gray" size="sm" onClick={forgetAccessCode} isDisabled={busy}>
            Forget the code
          </Button>
        </div>
      )}
      <Button color="primary" size="md" iconTrailing={ArrowRight} onClick={onNext} className="justify-self-start">
        Start the tour
      </Button>
    </Section>
  );
}

/** The last few progress lines of the running step, inside the panel, so the page never moves. */
function Progress({ events }: { events: DemoEvent[] }) {
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [events.length]);
  return (
    <ol ref={list} aria-label="Progress" className="grid max-h-44 gap-1 overflow-y-auto rounded-lg bg-secondary p-3 text-xs">
      {events.length === 0 && <li className="text-tertiary">Connecting to the XRP Ledger Testnet</li>}
      {events.map((event, index) => (
        // Events are append-only, so the index is a stable key.
        <li key={index} className={cx(event.type === 'step' ? 'mt-1 font-semibold text-primary first:mt-0' : 'pl-3 text-secondary')}>
          {event.text}
        </li>
      ))}
    </ol>
  );
}

function EvidenceLinks({ links }: { links: { key: string; label: string; href?: string | undefined }[] }) {
  return (
    <div className="grid gap-2">
      <p className="text-sm font-semibold text-primary">Show me the evidence</p>
      {links.map((link, index) =>
        link.href === undefined ? (
          <p key={link.key} className="text-sm text-tertiary">
            {link.label}: this step has not run yet.
          </p>
        ) : (
          <Button key={link.key} href={link.href} color={index === 0 ? 'primary' : 'secondary'} size="sm" className="justify-self-start">
            {link.label}
          </Button>
        ),
      )}
    </div>
  );
}

function LiveStepView({ step, evidence }: { step: LiveStep; evidence: EvidenceState }) {
  const { state, busy, accessCode } = useRun();
  const { runStory } = useLiveActions();
  const [showLatest, setShowLatest] = useState(false);
  const [retries, setRetries] = useState(0);
  const mine = state.status !== 'idle' && state.source === 'tour' && state.label === step.title;
  const waiting = mine && state.status === 'failed' && state.conflict && retries < MAX_RETRIES;
  const stepEvidence = evidence.status === 'ready' ? evidence.evidence.steps[String(step.index)] : undefined;
  const last = mine ? state.events.at(-1) : undefined;
  const explanation = last?.type === 'done' ? last.explanation : undefined;

  // Another visitor's step holds the ledger for about 20 seconds: wait, then try again by itself.
  useEffect(() => {
    if (!waiting) return;
    const timer = setTimeout(() => {
      setRetries((count) => count + 1);
      runStory(step.scenario, 'tour');
    }, RETRY_MS);
    return () => {
      clearTimeout(timer);
    };
  }, [waiting, runStory, step.scenario]);

  const run = (): void => {
    setRetries(0);
    runStory(step.scenario, 'tour');
  };

  return (
    <Section>
      <p className="text-md text-primary">{step.intro.join(' ')}</p>

      {accessCode !== undefined && !(mine && state.status === 'running') && !waiting && (
        <Button color="primary" size="md" iconLeading={PlayCircle} isDisabled={busy} onClick={run} className="justify-self-start">
          {mine && state.status === 'failed' ? 'Try again' : 'Run live on Testnet'}
        </Button>
      )}

      {mine && state.status === 'running' && (
        <div className="grid gap-2" role="status">
          <p className="text-sm font-semibold text-primary">Running live on Testnet. It takes about 20 seconds.</p>
          <Progress events={state.events} />
        </div>
      )}

      {waiting && (
        <p role="status" className="rounded-lg bg-secondary px-3 py-2.5 text-sm text-secondary">
          Another visitor is running a step. It takes about 20 seconds. This step starts by itself as soon as the ledger is free.
        </p>
      )}

      {mine && state.status === 'failed' && !waiting && last !== undefined && (
        <p role="alert" className="rounded-lg bg-error-primary px-3 py-2.5 text-sm text-error-primary">
          {last.text.includes('Nothing further was submitted') ? last.text : `${last.text} Nothing further was submitted.`}
        </p>
      )}

      {explanation !== undefined && (
        <div className="grid gap-3 border-t border-secondary pt-4">
          <p className="text-sm font-semibold text-primary">What happened</p>
          <p className="text-sm text-secondary">{explanation.sentences.join(' ')}</p>
          <p className="text-sm text-tertiary">{step.decidedBy}</p>
          {stepEvidence?.thuso !== undefined && <AssistantNote>{stepEvidence.thuso}</AssistantNote>}
          {stepEvidence !== undefined && <EvidenceLinks links={stepEvidence.links} />}
        </div>
      )}

      {explanation === undefined && !(mine && state.status === 'running') && (
        <div className="grid gap-3 border-t border-secondary pt-4">
          {accessCode === undefined && <p className="text-sm text-tertiary">Without the access code, you can see the latest live run of this step.</p>}
          {!showLatest ? (
            <Button color="secondary" size="sm" onClick={() => { setShowLatest(true); }} className="justify-self-start">
              Show the latest live run
            </Button>
          ) : evidence.status === 'loading' ? (
            <p className="text-sm text-tertiary">Reading the latest run from the records.</p>
          ) : evidence.status === 'error' || stepEvidence === undefined ? (
            <p role="alert" className="text-sm text-error-primary">The latest run could not be read. Try again in a minute.</p>
          ) : stepEvidence.latestRun === undefined ? (
            <p className="text-sm text-tertiary">This step has not run live yet. Enter the access code in the welcome step to run it.</p>
          ) : (
            <div className="grid gap-3" data-testid="latest-run">
              <p className="text-sm text-secondary">
                <span className="font-semibold text-primary">Latest live run:</span> {stepEvidence.latestRun.when}.{' '}
                {stepEvidence.latestRun.summary}
              </p>
              <p className="text-sm text-tertiary">{step.decidedBy}</p>
              {stepEvidence.thuso !== undefined && <AssistantNote>{stepEvidence.thuso}</AssistantNote>}
              <EvidenceLinks links={stepEvidence.links} />
            </div>
          )}
        </div>
      )}
    </Section>
  );
}

function TryStep() {
  const { close } = useTour();
  const { state, busy, accessCode } = useRun();
  const { restore } = useLiveActions();
  const restoring = state.status === 'running' && state.source === 'tour' && state.label === RESTORE_LABEL;
  return (
    <Section>
      <p className="text-md text-primary">
        Give the agent an instruction of your own, with today’s allowance in view. Try to break the rules: pay someone new, pay too
        much, or tell it to ignore its limits.
      </p>
      <Button href={tryItHref(LAST_STEP)} color="primary" size="md" className="justify-self-start">
        Open Give an instruction
      </Button>

      <div className="grid gap-3 border-t border-secondary pt-4">
        <p className="text-sm font-semibold text-primary">What the tour showed</p>
        <ul className="grid gap-3">
          {CFO_QUESTIONS.map((item) => (
            <li key={item.question} className="flex gap-2.5 text-sm">
              <CheckCircle className="mt-0.5 size-4 shrink-0 text-fg-success-primary" aria-hidden />
              <span className="grid gap-0.5">
                <span className="font-semibold text-primary">{item.question}</span>
                <span className="text-secondary">{item.answer}</span>
                <span className="text-xs text-tertiary">Shown in {item.steps.length === 1 ? 'step' : 'steps'} {item.steps.map((step) => String(step + 1)).join(', ')}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-secondary pt-4">
        <Button color="secondary" size="md" onClick={close}>
          Explore on your own
        </Button>
        <Button
          color="secondary"
          size="md"
          iconLeading={RefreshCcw01}
          isDisabled={busy || accessCode === undefined}
          isLoading={restoring}
          showTextWhileLoading
          onClick={() => {
            restore('tour');
          }}
        >
          {RESTORE_LABEL}
        </Button>
      </div>
      <p className="text-xs text-tertiary">
        Everyone sees the same sample workspace. {RESTORE_LABEL} puts back the sample agent, its spending rules and its RLUSD for all
        visitors.
      </p>
    </Section>
  );
}

/**
 * The guided tour, in a side panel that leaves the product usable beside it
 * (a sheet from the bottom on phones). Six steps; four run live, then show
 * where the proof is. Escape closes it; the step stays in the address.
 */
export function TourPanel() {
  const { open, step, goTo, close } = useTour();
  const heading = useRef<HTMLHeadingElement>(null);
  const evidence = useTourEvidence(open);
  const index = step ?? 0;
  const current = TOUR_STEPS[index] ?? TOUR_STEPS[0];

  useEffect(() => {
    if (open) heading.current?.focus();
  }, [open, index]);

  return (
    <aside
      id="guided-tour"
      aria-label="Guided tour"
      hidden={!open}
      onKeyDown={(event) => {
        if (event.key === 'Escape') close();
      }}
      className="fixed inset-x-0 bottom-0 z-40 flex max-h-[75dvh] flex-col overflow-hidden rounded-t-2xl bg-primary shadow-xl ring-1 ring-secondary lg:inset-x-auto lg:top-0 lg:right-0 lg:max-h-none lg:w-100 lg:rounded-none"
    >
      <div className="grid gap-3 border-b border-secondary px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-brand-secondary">Guided tour</p>
          <Button color="tertiary" size="sm" iconLeading={X} onClick={close} aria-label="Close the guided tour" />
        </div>
        <div className="grid gap-1.5">
          <p className="text-xs text-tertiary tabular-nums">{stepLabel(index)}</p>
          <ProgressBarBase value={((index + 1) / TOUR_STEPS.length) * 100} label={stepLabel(index)} className="h-1.5 bg-tertiary" />
        </div>
        <h2 ref={heading} tabIndex={-1} className="text-lg font-semibold text-primary" style={{ outline: 'none' }}>
          {current?.title}
        </h2>
      </div>

      <div className="grid content-start gap-5 overflow-y-auto px-5 py-5">
        {current?.kind === 'welcome' && (
          <WelcomeStep
            onNext={() => {
              goTo(1);
            }}
          />
        )}
        {current?.kind === 'live' && <LiveStepView key={current.index} step={current} evidence={evidence} />}
        {current?.kind === 'try' && <TryStep />}
      </div>

      <nav aria-label="Tour steps" className="grid gap-3 border-t border-secondary px-5 py-3">
        <ol className="flex flex-wrap gap-1.5">
          {TOUR_STEPS.map((item) => (
            <li key={item.index}>
              <button
                type="button"
                onClick={() => {
                  goTo(item.index);
                }}
                aria-current={item.index === index ? 'step' : undefined}
                aria-label={`${stepLabel(item.index)}: ${item.title}`}
                className={cx(
                  'flex size-7 items-center justify-center rounded-full text-xs font-semibold tabular-nums outline-focus-ring focus-visible:outline-2',
                  item.index === index ? 'bg-brand-solid text-white' : 'bg-secondary text-secondary hover:bg-secondary_hover',
                )}
              >
                {item.index + 1}
              </button>
            </li>
          ))}
        </ol>
        <div className="flex justify-between gap-3">
          <Button color="secondary" size="sm" iconLeading={ArrowLeft} isDisabled={index === 0} onClick={() => { goTo(index - 1); }}>
            Back
          </Button>
          <Button color="secondary" size="sm" iconTrailing={ArrowRight} isDisabled={index === LAST_STEP} onClick={() => { goTo(index + 1); }}>
            Next
          </Button>
        </div>
      </nav>
    </aside>
  );
}
