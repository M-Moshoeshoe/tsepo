'use client';

import { CheckCircle2, Hourglass, RotateCcw, XCircle } from 'lucide-react';
import { useEffect, useRef, useState, type SyntheticEvent } from 'react';
import type { RunKind } from '../src/demo/events.ts';
import { ExplorerLink } from './display.tsx';
import { useRun, type RunState } from './run-provider.tsx';
import { Button } from './ui/button.tsx';
import { cn } from './ui/cn.ts';
import { Input, Label } from './ui/input.tsx';

const SCENARIOS: { kind: Extract<RunKind, `scenario-${string}`>; number: number; label: string }[] = [
  { kind: 'scenario-1', number: 1, label: 'Unknown agent' },
  { kind: 'scenario-2', number: 2, label: 'Verified agent' },
  { kind: 'scenario-3', number: 3, label: 'Split payments' },
  { kind: 'scenario-4', number: 4, label: 'Revoke' },
];

function useElapsedSeconds(state: RunState): number {
  const [now, setNow] = useState(() => Date.now());
  const running = state.status === 'running';
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => { setNow(Date.now()); }, 1000);
    return () => { clearInterval(timer); };
  }, [running]);
  if (state.status === 'idle') return 0;
  return Math.max(0, Math.round(((state.finishedAt ?? now) - state.startedAt) / 1000));
}

function RunProgress({ state, busy, onClose }: { state: Exclude<RunState, { status: 'idle' }>; busy: boolean; onClose: () => void }) {
  const seconds = useElapsedSeconds(state);
  const list = useRef<HTMLOListElement>(null);
  const count = state.events.length;

  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight });
  }, [count]);

  const summary =
    state.status === 'running'
      ? `Running, ${seconds} seconds so far`
      : state.status === 'done'
        ? `Finished in ${seconds} seconds`
        : `Stopped after ${seconds} seconds`;

  return (
    <section aria-label="Run progress" className="border-t border-border">
      <div className="mx-auto flex max-w-[1232px] items-center justify-between gap-3 px-4 pt-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-ink">
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
      <ol
        ref={list}
        aria-live="polite"
        className="mx-auto mt-2 mb-3 grid max-h-64 max-w-[1232px] gap-1 overflow-y-auto px-4 text-sm"
      >
        {state.events.length === 0 && <li className="text-muted">Connecting to the XRP Ledger Testnet</li>}
        {state.events.map((event, index) => (
          <li
            // Events are append-only, so the index is a stable key.
            key={index}
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
            <span>{event.text}</span>
            {event.type === 'line' && event.hash !== undefined && <ExplorerLink hash={event.hash}>Transaction</ExplorerLink>}
          </li>
        ))}
      </ol>
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
    <form onSubmit={submit} className="grid gap-1.5 sm:flex sm:items-end sm:gap-2" noValidate>
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
      <Button type="submit" size="md">
        Unlock the demo controls
      </Button>
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
    <div className="border-b border-border bg-surface">
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
      {state.status !== 'idle' && <RunProgress state={state} busy={busy} onClose={dismiss} />}
    </div>
  );
}
