'use client';

import { CheckCircle, LinkExternal01, XCircle } from '@untitledui/icons';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/base/buttons/button';
import { cx } from '@/utils/cx';
import type { DemoEvent, Explanation } from '../../src/demo/events.ts';
import { TESTNET_EXPLORER } from '../../src/ledger/testnet.ts';
import { actorName, decisionNote } from '../../src/views/actors.ts';
import { runEndAnnouncement } from '../../src/views/announcement.ts';
import { useRun, type RunState } from '../run-provider.tsx';
import { Term } from '../term.tsx';

type ActiveRun = Exclude<RunState, { status: 'idle' }>;

function useElapsedSeconds(state: RunState): number {
  const [now, setNow] = useState(() => Date.now());
  const running = state.status === 'running';
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => {
      clearInterval(timer);
    };
  }, [running]);
  if (state.status === 'idle') return 0;
  return Math.max(0, Math.round(((state.finishedAt ?? now) - state.startedAt) / 1000));
}

/** Explains the two ledger result codes wherever they appear. */
function withTerms(text: string): ReactNode {
  return text.split(/(tecNO_PERMISSION|tecBAD_CREDENTIALS)/).map((part, index) =>
    part === 'tecNO_PERMISSION' || part === 'tecBAD_CREDENTIALS' ? (
      // The parts come from a fixed split, so the index is a stable key.
      <Term key={index} term={part}>
        {part}
      </Term>
    ) : (
      part
    ),
  );
}

function ExplorerAnchor({ hash, children }: { hash: string; children: ReactNode }) {
  return (
    <a
      href={`${TESTNET_EXPLORER}/transactions/${hash}`}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1 rounded-sm font-semibold text-brand-secondary outline-focus-ring hover:text-brand-secondary_hover focus-visible:outline-2"
    >
      {children}
      <LinkExternal01 className="size-3.5" aria-hidden />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

/** Two plain sentences on the result, the control that decided it, and the evidence. */
function WhatJustHappened({ explanation }: { explanation: Explanation }) {
  const { evidence } = explanation;
  return (
    <section aria-labelledby="what-just-happened" className="grid gap-2">
      <h2 id="what-just-happened" className="text-md font-semibold text-primary">
        What just happened
      </h2>
      <p className="max-w-4xl text-sm text-secondary">
        {withTerms(explanation.sentences[0])} {withTerms(explanation.sentences[1])}
      </p>
      <p className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
        <span>
          <span className="text-tertiary">Decided by </span>
          <span className="font-semibold text-primary">{actorName(explanation.decidedBy)}</span>
          {explanation.decidedBy === 'exchange' && (
            <span className="text-tertiary">. {decisionNote(explanation.decidedBy, 'cleared')}</span>
          )}
        </span>
        {evidence.hash !== undefined && <ExplorerAnchor hash={evidence.hash}>{evidence.label}</ExplorerAnchor>}
        {evidence.hash === undefined && evidence.path !== undefined && (
          <Link href={evidence.path} className="rounded-sm font-semibold text-brand-secondary hover:text-brand-secondary_hover">
            {evidence.label}
          </Link>
        )}
      </p>
    </section>
  );
}

function EventLine({ event }: { event: DemoEvent }) {
  return (
    <li
      className={cx(
        'flex flex-wrap items-baseline gap-x-3',
        event.type === 'step' && 'mt-2 font-semibold text-primary first:mt-0',
        event.type === 'line' && 'pl-4 text-secondary',
        event.type === 'done' && 'mt-2 font-semibold text-success-primary',
        event.type === 'failed' && 'mt-2 font-semibold text-error-primary',
      )}
    >
      {event.type === 'done' && <CheckCircle className="size-4 self-center" aria-hidden />}
      {event.type === 'failed' && <XCircle className="size-4 self-center" aria-hidden />}
      <span>{withTerms(event.text)}</span>
      {event.type === 'line' && event.hash !== undefined && <ExplorerAnchor hash={event.hash}>Transaction</ExplorerAnchor>}
    </li>
  );
}

function RunPanel({ state, busy, onClose }: { state: ActiveRun; busy: boolean; onClose: () => void }) {
  const seconds = useElapsedSeconds(state);
  const list = useRef<HTMLOListElement>(null);
  const count = state.events.length;
  const last = state.events.at(-1);
  const explanation = last?.type === 'done' ? last.explanation : undefined;

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [count]);

  const summary =
    state.status === 'running'
      ? `Running, ${seconds} seconds so far`
      : state.status === 'done'
        ? `Finished in ${seconds} seconds`
        : `Stopped after ${seconds} seconds`;

  const log = (
    <ol ref={list} aria-live="polite" className="mt-2 grid max-h-64 gap-1 overflow-y-auto text-sm">
      {state.events.length === 0 && <li className="text-tertiary">Connecting to the XRP Ledger Testnet</li>}
      {state.events.map((event, index) => (
        // Events are append-only, so the index is a stable key.
        <EventLine key={index} event={event} />
      ))}
    </ol>
  );

  return (
    <section aria-label="Run progress" className="mx-4 mb-2 grid gap-4 rounded-xl bg-secondary p-5 lg:mx-8">
      <div className="flex items-center justify-between gap-3">
        <p className="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold text-primary">
          {state.label}
          <span className="font-normal text-tertiary tabular-nums">{summary}</span>
        </p>
        {!busy && (
          <Button color="link-gray" size="sm" onClick={onClose}>
            Close
          </Button>
        )}
      </div>
      {explanation === undefined ? (
        log
      ) : (
        <>
          <WhatJustHappened explanation={explanation} />
          <details className="text-sm">
            <summary className="cursor-pointer rounded-sm font-semibold text-brand-secondary">
              All steps ({state.events.length})
            </summary>
            {log}
          </details>
        </>
      )}
    </section>
  );
}

/**
 * The thin bar under the header while a run is going (motion 7), and the run
 * result once it ends. The status line is always present, so screen readers
 * hear "finished" or "stopped" when a run ends.
 */
export function RunResult() {
  const { state, busy, dismiss } = useRun();
  const last = state.status === 'idle' ? undefined : state.events.at(-1);
  const announcement =
    state.status === 'idle' ? '' : runEndAnnouncement(state.label, state.status, last?.type === 'failed' ? last.text : undefined);
  return (
    <>
      <p role="status" className="sr-only">
        {announcement}
      </p>
      <div className="h-0.5 overflow-hidden" aria-hidden={!busy}>
        {busy && (
          <div role="progressbar" aria-label="A demo run is in progress" className="h-full bg-brand-primary">
            <div className="run-progress h-full w-1/3 bg-brand-solid" />
          </div>
        )}
      </div>
      {state.status !== 'idle' && <RunPanel state={state} busy={busy} onClose={dismiss} />}
    </>
  );
}
