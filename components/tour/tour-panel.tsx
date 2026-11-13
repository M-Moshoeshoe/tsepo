'use client';

import { ArrowLeft, ArrowRight, CheckCircle, FastForward, PauseCircle, PlayCircle, RefreshCcw01, X } from '@untitledui/icons';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/base/buttons/button';
import { cx } from '@/utils/cx';
import type { DemoEvent } from '../../src/demo/events.ts';
import { RECEIVING_PLATFORM_LINE } from '../../src/views/navigation.ts';
import { atStage, placeCard, stageHref, storyCaption, STORY_DWELL_MS, STORY_WELCOME_MS, type Box, type Placement, type Size } from '../../src/views/tour-stage.ts';
import { CFO_QUESTIONS, LAST_STEP, SCHEDULE_NOTE, stepLabel, TOUR_PURPOSE, TOUR_STEPS, tryItHref, type LiveStep, type TourEvidence } from '../../src/views/tour.ts';
import { AssistantNote } from '../assistant-note.tsx';
import { useRun } from '../run-provider.tsx';
import { AccessCodeForm } from '../shell/access-code-dialog.tsx';
import { RESTORE_LABEL, useLiveActions } from '../shell/live-actions.tsx';
import { Spotlight } from './spotlight.tsx';
import { useTour } from './tour-provider.tsx';
import { useTourEvidence, type EvidenceState } from './use-tour-evidence.ts';

/** How long to wait before trying again when another visitor's step is running, and how often. */
const RETRY_MS = 5000;
const MAX_RETRIES = 12;

function reducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function Section({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx('grid gap-3', className)}>{children}</div>;
}

function WelcomeStep({ onWalk, onPlay, story }: { onWalk: () => void; onPlay: () => void; story: boolean }) {
  const { accessCode, saveAccessCode, forgetAccessCode, busy } = useRun();
  return (
    <Section>
      <AssistantNote>{TOUR_PURPOSE}</AssistantNote>
      {!story && (
        <div className="flex flex-wrap gap-3">
          <Button color="primary" size="md" iconLeading={PlayCircle} onClick={onPlay}>
            Play the story
          </Button>
          <Button color="secondary" size="md" iconTrailing={ArrowRight} onClick={onWalk}>
            Walk through it myself
          </Button>
        </div>
      )}
      <ul className="grid gap-2 text-sm text-secondary">
        <li>
          <span className="font-semibold text-primary">Business:</span> Lesedi Design Studio runs the agent and sets the spending rules it
          cannot break.
        </li>
        <li>
          <span className="font-semibold text-primary">Receiving platform:</span> {RECEIVING_PLATFORM_LINE} It accepts payments only from
          verified agents.
        </li>
      </ul>
      {accessCode === undefined ? (
        <section aria-labelledby="tour-access" className="grid gap-3 rounded-lg bg-secondary p-4">
          <h3 id="tour-access" className="text-sm font-semibold text-primary">
            The access code
          </h3>
          <p className="text-sm text-tertiary">
            Live steps move test funds, so they need the access code from the submission. No code? The tour still shows the latest live run
            of each step.
          </p>
          <AccessCodeForm onSave={saveAccessCode} />
          {!story && (
            <Button color="link-color" size="sm" onClick={onWalk} className="justify-self-start">
              Skip, and see the latest runs
            </Button>
          )}
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
    </Section>
  );
}

/** The last few progress lines of the running step, inside the card, so the page never moves. */
function Progress({ events }: { events: DemoEvent[] }) {
  const list = useRef<HTMLOListElement>(null);
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [events.length]);
  return (
    <ol ref={list} aria-label="Progress" className="grid max-h-32 gap-1 overflow-y-auto rounded-lg bg-secondary p-3 text-xs">
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

function LiveStepView({ step, evidence, autoLatest }: { step: LiveStep; evidence: EvidenceState; autoLatest: boolean }) {
  const { state, busy, accessCode } = useRun();
  const { runStory } = useLiveActions();
  const [showLatest, setShowLatest] = useState(autoLatest);
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
      <AssistantNote>{step.intro.join(' ')}</AssistantNote>

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
          {stepEvidence?.thuso !== undefined && <AssistantNote>{stepEvidence.thuso}</AssistantNote>}
          <p className="text-sm text-secondary">{explanation.sentences.join(' ')}</p>
          <p className="text-sm text-tertiary">{step.decidedBy}</p>
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
              {stepEvidence.thuso !== undefined && <AssistantNote>{stepEvidence.thuso}</AssistantNote>}
              <p className="text-sm text-secondary">
                <span className="font-semibold text-primary">Latest live run:</span> {stepEvidence.latestRun.when}.{' '}
                {stepEvidence.latestRun.summary}
              </p>
              <p className="text-sm text-tertiary">{step.decidedBy}</p>
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
      <AssistantNote>
        Now give the agent an instruction of your own, with today’s allowance in view. Try to break the rules: ask it to pay someone new, pay too much or ignore its limits.
      </AssistantNote>
      <Button href={tryItHref(LAST_STEP)} color="primary" size="md" className="justify-self-start">
        Open Give an instruction
      </Button>
      <p className="text-sm text-secondary">{SCHEDULE_NOTE}</p>

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

/** The address as it is now, path and query, from the router. */
function useCurrentHref(): string {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  return search === '' ? pathname : `${pathname}?${search}`;
}

/**
 * "Play the story": the tour moving on by itself. On each live step it runs
 * the step live when the access code is there and waits for the result, or
 * otherwise uses the latest live run; then it opens the evidence, lets the
 * caption be read, and moves on. With reduced motion it never moves on by
 * itself: Next does. It stops at the last step.
 */
function useStoryPlayer(input: { index: number; evidence: EvidenceState; move: (step: number) => void }): { caption: string; ended: boolean } {
  const { index, evidence, move } = input;
  const { mode, playing, pause } = useTour();
  const { state, busy, accessCode } = useRun();
  const { runStory } = useLiveActions();
  const router = useRouter();
  const current = useCurrentHref();
  const started = useRef(new Map<number, string>());
  const step = TOUR_STEPS[index];
  const live = step?.kind === 'live' ? step : undefined;
  const mine = live !== undefined && state.status !== 'idle' && state.source === 'tour' && state.label === live.title;
  const story = mode === 'story';

  // A new story starts with nothing run.
  useEffect(() => {
    if (story && index === 0) started.current.clear();
  }, [story, index]);

  const ready = evidence.status === 'ready' ? evidence.evidence : undefined;
  const startedAt = started.current.get(index);
  const latest = ready?.steps[String(index)]?.latestRun;
  // After a run in this story, wait for the records of that run, so the evidence is the new one.
  const fresh = startedAt === undefined || (latest !== undefined && Date.parse(latest.at) >= Date.parse(startedAt) - 60_000);

  useEffect(() => {
    if (!story || !playing || step === undefined) return undefined;
    if (step.kind === 'try') {
      pause();
      return undefined;
    }
    if (step.kind === 'welcome') {
      if (reducedMotion()) return undefined;
      const timer = window.setTimeout(() => {
        move(1);
      }, STORY_WELCOME_MS);
      return () => {
        window.clearTimeout(timer);
      };
    }
    if (accessCode !== undefined) {
      if (!started.current.has(index)) {
        if (busy) return undefined;
        started.current.set(index, new Date().toISOString());
        runStory(step.scenario, 'tour');
        return undefined;
      }
      if (mine && state.status === 'running') return undefined;
      if (mine && state.status === 'failed') {
        // A clash with another visitor retries by itself; any other failure pauses the story with its message showing.
        if (!state.conflict) pause();
        return undefined;
      }
    }
    if (ready === undefined || !fresh) return undefined;
    const stage = stageHref(index, ready);
    if (stage !== undefined && !atStage(current, stage)) {
      router.push(stage, { scroll: false });
      return undefined;
    }
    if (reducedMotion()) return undefined;
    const timer = window.setTimeout(() => {
      move(index + 1);
    }, STORY_DWELL_MS);
    return () => {
      window.clearTimeout(timer);
    };
  }, [story, playing, step, index, accessCode, busy, mine, state, ready, fresh, current, router, move, pause, runStory]);

  const ended = story && step?.kind === 'try';
  let caption = '';
  if (story && step !== undefined) {
    if (ended) caption = storyCaption({ index, phase: 'ended' });
    else if (!playing) caption = storyCaption({ index, phase: 'paused' });
    else if (step.kind === 'welcome') caption = 'Playing the story: each step runs, then its proof opens on the page.';
    else if (mine && state.status === 'running') caption = storyCaption({ index, phase: 'running' });
    else if (mine && state.status === 'failed' && state.conflict) caption = storyCaption({ index, phase: 'waiting' });
    else {
      const last = mine ? state.events.at(-1) : undefined;
      const summary = last?.type === 'done' ? last.text : latest?.summary;
      caption = summary === undefined && ready !== undefined ? storyCaption({ index, phase: 'no-run' }) : storyCaption({ index, phase: 'showing', summary });
    }
  }
  return { caption, ended };
}

/** Where the card goes, from the lit element and the card's own size, kept up to date as either moves. */
function usePlacement(card: React.RefObject<HTMLDivElement | null>, target: Box | undefined): Placement {
  const [size, setSize] = useState<Size>({ width: 384, height: 320 });
  const [viewport, setViewport] = useState<Size>({ width: 1280, height: 900 });

  useLayoutEffect(() => {
    const element = card.current;
    if (element === null) return undefined;
    const update = (): void => {
      setSize({ width: element.offsetWidth, height: element.offsetHeight });
      setViewport({ width: window.innerWidth, height: window.innerHeight });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [card]);

  return placeCard(target, size, viewport);
}

const PLACEMENT_CLASS: Record<Placement['kind'], string> = {
  dock: 'inset-x-2 bottom-2 max-h-[60dvh]',
  corner: 'right-6 bottom-6 max-h-[calc(100dvh-3rem)]',
  beside: 'max-h-[calc(100dvh-2rem)]',
};

/**
 * The guided tour, as a floating card beside what it explains. The page dims
 * and the element being explained is lit (see Spotlight); the card is a
 * labelled, non-modal dialog, so the page stays reachable and nothing traps
 * focus. Six steps; four run live, then show where the proof is. The step
 * stays in the address. Escape ends the tour and returns focus to where the
 * visitor was.
 */
export function TourPanel() {
  const { open, step, mode, playing, goTo, close, show, playStory, pause, resume } = useTour();
  const router = useRouter();
  const current = useCurrentHref();
  const heading = useRef<HTMLHeadingElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const evidence = useTourEvidence(open);
  const [target, setTarget] = useState<Box | undefined>(undefined);
  const placement = usePlacement(card, target);
  const index = step ?? 0;
  const currentStep = TOUR_STEPS[index] ?? TOUR_STEPS[0];
  const ready: TourEvidence | undefined = evidence.status === 'ready' ? evidence.evidence : undefined;
  const story = mode === 'story';

  /** Moves to a step: to its evidence page when there is one, otherwise just the step. */
  const move = useCallback(
    (to: number) => {
      const clamped = Math.min(Math.max(to, 0), LAST_STEP);
      const stage = stageHref(clamped, ready);
      if (stage !== undefined && !atStage(current, stage)) router.push(stage, { scroll: false });
      else goTo(clamped);
    },
    [ready, current, router, goTo],
  );

  const player = useStoryPlayer({ index, evidence, move });

  useEffect(() => {
    if (open) heading.current?.focus({ preventScroll: true });
  }, [open, index]);

  // Escape ends the tour, unless it belongs to another dialog, such as a details sheet.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      const owner = event.target instanceof Element ? event.target.closest('[role="dialog"]') : null;
      if (owner !== null && owner.id !== 'guided-tour') return;
      close();
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const onTarget = useCallback((box: Box | undefined) => {
    setTarget(box);
  }, []);

  if (!open) return null;
  const style = placement.kind === 'beside' ? { top: placement.top, left: placement.left } : undefined;

  return (
    <>
      <Spotlight onTarget={onTarget} />
      <div
        ref={card}
        id="guided-tour"
        role="dialog"
        aria-modal="false"
        aria-label="Guided tour"
        aria-describedby="tour-step-label tour-title"
        style={style}
        className={cx(
          'fixed z-[70] flex w-[min(24rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-2xl bg-primary shadow-xl ring-1 ring-secondary transition-[top,left] duration-200 motion-reduce:transition-none',
          PLACEMENT_CLASS[placement.kind],
        )}
      >
        <div className="grid gap-2 border-b border-secondary px-5 pt-4 pb-3">
          <div className="flex items-center justify-between gap-3">
            <p id="tour-step-label" className="text-xs font-semibold text-brand-secondary tabular-nums">
              {story ? 'The story' : 'Guided tour'} · {stepLabel(index)}
            </p>
            <Button color="tertiary" size="sm" iconLeading={X} onClick={close} aria-label="Close the guided tour" />
          </div>
          <h2 id="tour-title" ref={heading} tabIndex={-1} className="text-lg font-semibold text-primary" style={{ outline: 'none' }}>
            {currentStep?.title}
          </h2>
          {story && (
            <p aria-live="polite" data-testid="story-caption" className="text-sm text-secondary">
              {player.caption}
            </p>
          )}
        </div>

        <div className="grid content-start gap-5 overflow-y-auto px-5 py-4">
          {currentStep?.kind === 'welcome' && (
            <WelcomeStep
              story={story}
              onWalk={() => {
                show(1);
                move(1);
              }}
              onPlay={playStory}
            />
          )}
          {currentStep?.kind === 'live' && <LiveStepView key={`${String(currentStep.index)}-${mode}`} step={currentStep} evidence={evidence} autoLatest={story} />}
          {currentStep?.kind === 'try' && <TryStep />}
        </div>

        <nav aria-label="Tour steps" className="grid gap-3 border-t border-secondary px-5 py-3">
          <ol className="flex items-center gap-2">
            {TOUR_STEPS.map((item) => (
              <li key={item.index}>
                <button
                  type="button"
                  onClick={() => {
                    move(item.index);
                  }}
                  aria-current={item.index === index ? 'step' : undefined}
                  aria-label={`${stepLabel(item.index)}: ${item.title}`}
                  className="flex size-6 items-center justify-center rounded-full outline-focus-ring focus-visible:outline-2"
                >
                  <span
                    aria-hidden
                    className={cx(
                      'block rounded-full transition-[width,background-color] duration-150 motion-reduce:transition-none',
                      item.index === index ? 'h-2 w-5 bg-brand-solid' : item.index < index ? 'size-2 bg-brand-secondary' : 'size-2 bg-quaternary',
                    )}
                  />
                </button>
              </li>
            ))}
          </ol>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Button color="secondary" size="sm" iconLeading={ArrowLeft} isDisabled={index === 0} onClick={() => { move(index - 1); }}>
              Back
            </Button>
            {story && !player.ended && (
              <div className="flex gap-2">
                <Button color="secondary" size="sm" iconLeading={playing ? PauseCircle : PlayCircle} onClick={playing ? pause : resume}>
                  {playing ? 'Pause' : 'Resume'}
                </Button>
                <Button
                  color="secondary"
                  size="sm"
                  iconLeading={FastForward}
                  onClick={() => {
                    pause();
                    move(LAST_STEP);
                  }}
                >
                  Skip to the end
                </Button>
              </div>
            )}
            <Button color="secondary" size="sm" iconTrailing={ArrowRight} isDisabled={index === LAST_STEP} onClick={() => { move(index + 1); }}>
              Next
            </Button>
          </div>
        </nav>
      </div>
    </>
  );
}
