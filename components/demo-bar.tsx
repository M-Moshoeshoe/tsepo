'use client';

import { CheckCircle2, Hourglass, RotateCcw, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode, type SyntheticEvent } from 'react';
import type { DemoEvent, Explanation, RunKind } from '../src/demo/events.ts';
import { ExplorerLink } from './display.tsx';
import { useRun, type RunState } from './run-provider.tsx';
import { Term } from './term.tsx';
import { Button } from './ui/button.tsx';
import { cn } from './ui/cn.ts';
import { Input, Label } from './ui/input.tsx';

const SCENARIOS: { kind: Extract<RunKind, `scenario-${string}`>; number: number; label: string }[] = [
  { kind: 'scenario-1', number: 1, label: 'Unknown agent' },
  { kind: 'scenario-2', number: 2, label: 'Verified agent' },
  { kind: 'scenario-3', number: 3, label: 'Split payments' },
  { kind: 'scenario-4', number: 4, label: 'Revoke' },
];

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

/** Two plain sentences on the result, the control that decided it, and the evidence. */
function WhatJustHappened({ explanation }: { explanation: Explanation }) {
  const { evidence } = explanation;
  return (
    <section aria-labelledby="what-just-happened" className="grid gap-2 rounded-md border border-border bg-surface p-4">
      <h2 id="what-just-happened" className="text-sm font-semibold text-ink">
        What just happened
      </h2>
      <p className="text-sm text-ink">
        {renderTerms(explanation.sentences[0])} {renderTerms(explanation.sentences[1])}
      </p>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span>
          <span className="text-muted">Decided by </span>
          <span className="font-medium text-ink">
            {explanation.decidedBy === 'ledger' ? 'the XRP Ledger itself' : 'the policy service'}
          </span>
        </span>
        {evidence.hash !== undefined && <ExplorerLink hash={evidence.hash}>{evidence.label}</ExplorerLink>}
        {evidence.hash === undefined && evidence.path !== undefined && (
          <Link href={evidence.path} className="rounded-md text-sm font-medium text-primary hover:underline">
            {evidence.label}
          </Link>
        )}
      </p>
    </section>
  );
}

/** Explains the two ledger result codes wherever they appear. */
function renderTerms(text: string): ReactNode {
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

function EventLine({ event }: { event: DemoEvent }) {
  return (
    <li
      className={cn(
        'flex flex-wrap items-baseline gap-x-3',
        event.type === 'step' && 'mt-2 font-medium text-ink first:mt-0',
        event.type === 'line' && 'pl-4 text-ink',
        event.type === 'done' && 'mt-2 rounded-md bg-cleared-bg px-3 py-2 font-medium text-cleared',
        event.type === 'failed' && 'mt-2 rounded-md bg-refused-bg px-3 py-2 font-medium text-refused',
      )}
    >
      {event.type === 'done' && <CheckCircle2 className="size-4 self-center" aria-hidden />}
      {event.type === 'failed' && <XCircle className="size-4 self-center" aria-hidden />}
      <span>{renderTerms(event.text)}</span>
      {event.type === 'line' && event.hash !== undefined && <ExplorerLink hash={event.hash}>Transaction</ExplorerLink>}
    </li>
  );
}

function RunProgress({ state, busy, onClose }: { state: ActiveRun; busy: boolean; onClose: () => void }) {
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
      {state.events.length === 0 && <li className="text-muted">Connecting to the XRP Ledger Testnet</li>}
      {state.events.map((event, index) => (
        // Events are append-only, so the index is a stable key.
        <EventLine key={index} event={event} />
      ))}
    </ol>
  );

  return (
    <section aria-label="Run progress" className="border-t border-border bg-background">
      <div className="mx-auto grid max-w-[1232px] gap-3 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <p className="flex flex-wrap items-center gap-x-2 text-sm font-semibold text-ink">
            {state.status === 'running' && <Hourglass className="size-4 text-primary" aria-hidden />}
            {state.label}
            <span className="font-normal text-muted tabular-nums">{summary}</span>
          </p>
          {!busy && (
            <Button variant="ghost" size="sm" onClick={onClose}>
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
              <summary className="cursor-pointer rounded-md font-medium text-primary">All steps ({state.events.length})</summary>
              {log}
            </details>
          </>
        )}
      </div>
    </section>
  );
}

/** Asks once for the demo access code. It is kept in session storage, never in the page address or a cookie. */
function UnlockForm({ onSave }: { onSave: (code: string) => void }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | undefined>(undefined);

  function submit(event: SyntheticEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = code.trim();
    if (trimmed.length < 6) {
      setError('Enter the demo access code. It has at least 6 characters.');
      return;
    }
    setError(undefined);
    onSave(trimmed);
    setCode('');
  }

  return (
    <form onSubmit={submit} className="grid gap-1.5 sm:flex sm:flex-wrap sm:items-end sm:gap-2" noValidate>
      <div className="grid gap-1.5">
        <Label htmlFor="demo-access-code">Demo access code</Label>
        <Input
          id="demo-access-code"
          type="password"
          autoComplete="off"
          value={code}
          onChange={(event) => {
            setCode(event.target.value);
          }}
          aria-invalid={error !== undefined}
          aria-describedby={error === undefined ? undefined : 'demo-access-code-error'}
          className="sm:w-56"
        />
      </div>
      <Button type="submit">Unlock the demo controls</Button>
      {error !== undefined && (
        <p id="demo-access-code-error" role="alert" className="text-sm text-refused sm:basis-full">
          {error}
        </p>
      )}
    </form>
  );
}

/** The demo controls: four scenarios and Reset, with live progress while a run is going. */
export function DemoBar() {
  const { state, busy, accessCode, saveAccessCode, forgetAccessCode, start, dismiss } = useRun();

  return (
    <div id="demo-controls" className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-[1232px] flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center">
        <div className="lg:mr-auto">
          <p className="text-sm font-semibold text-ink">Demo controls</p>
          <p className="text-xs text-muted">Runs on the XRP Ledger Testnet. Reset the demo before each scenario.</p>
        </div>
        {accessCode === undefined ? (
          <UnlockForm onSave={saveAccessCode} />
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            {SCENARIOS.map((scenario) => (
              <Button
                key={scenario.kind}
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => {
                  start({ kind: scenario.kind }, `Scenario ${scenario.number}: ${scenario.label}`);
                }}
              >
                <span className="font-semibold text-primary tabular-nums">{scenario.number}</span>
                {scenario.label}
              </Button>
            ))}
            <Button
              size="sm"
              disabled={busy}
              onClick={() => {
                start({ kind: 'reset' }, 'Reset demo');
              }}
            >
              <RotateCcw aria-hidden />
              Reset demo
            </Button>
            <Button variant="ghost" size="sm" disabled={busy} onClick={forgetAccessCode}>
              Forget code
            </Button>
          </div>
        )}
      </div>
      {busy && (
        <div role="progressbar" aria-label="A demo run is in progress" className="h-0.5 overflow-hidden bg-primary/15">
          <div className="run-progress h-full w-1/3 bg-primary" />
        </div>
      )}
      {state.status !== 'idle' && <RunProgress state={state} busy={busy} onClose={dismiss} />}
    </div>
  );
}
