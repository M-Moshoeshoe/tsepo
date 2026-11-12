'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition, type ReactNode } from 'react';
import { z } from 'zod';
import { ACCESS_CODE_HEADER, DemoEventSchema, type DemoEvent, type RunKind, type RunRequest } from '../src/demo/events.ts';
import { useToast } from './toast-provider.tsx';

export type RunState =
  | { status: 'idle' }
  | { status: 'running' | 'done' | 'failed'; label: string; events: DemoEvent[]; startedAt: number; finishedAt?: number };

interface RunContextValue {
  state: RunState;
  /**
   * True from the start of a run until its connection has closed and the page shows the new ledger state.
   * Controls stay disabled while busy, so nobody acts on data that is about to change.
   */
  busy: boolean;
  /** The access code for this browser session, once entered. */
  accessCode: string | undefined;
  saveAccessCode: (code: string) => void;
  forgetAccessCode: () => void;
  start: (request: RunRequest, label: string) => void;
  dismiss: () => void;
}

const RunContext = createContext<RunContextValue | null>(null);

const ErrorBodySchema = z.object({ error: z.string() });

const LOST_CONNECTION =
  'The connection to the server ended before the run finished. Refresh the page to see the ledger state before you try again.';

async function readError(response: Response): Promise<string> {
  try {
    const parsed = ErrorBodySchema.safeParse(await response.json());
    if (parsed.success) return parsed.data.error;
  } catch {
    // Fall through to the generic message.
  }
  return `The server refused the request (status ${response.status}). Nothing was run.`;
}

function parseLine(line: string): DemoEvent | undefined {
  try {
    const parsed = DemoEventSchema.safeParse(JSON.parse(line));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

const STORAGE_KEY = 'tsepo-demo-access-code';

/** Maintenance actions confirm with a toast; scenarios explain themselves in the run panel instead. */
const TOASTS: Partial<Record<RunKind, string>> = {
  reset: 'Sample data restored',
  'change-limits': 'Limits updated',
  revoke: 'Agent revoked',
};

/** Session storage can be unavailable (private windows, blocked storage); the code then lasts for this page only. */
function readStoredCode(): string | undefined {
  try {
    return sessionStorage.getItem(STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeStoredCode(code: string | undefined): void {
  try {
    if (code === undefined) sessionStorage.removeItem(STORAGE_KEY);
    else sessionStorage.setItem(STORAGE_KEY, code);
  } catch {
    // Kept in memory only.
  }
}

/** Runs one live action at a time and keeps its live progress for every component that shows it. */
export function RunProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const notify = useToast();
  const [state, setState] = useState<RunState>({ status: 'idle' });
  const [runActive, setRunActive] = useState(false);
  const [refreshing, startRefresh] = useTransition();
  const busy = runActive || refreshing;
  const [accessCode, setAccessCode] = useState<string | undefined>(undefined);
  const codeRef = useRef<string | undefined>(undefined);
  const running = useRef(false);

  useEffect(() => {
    const stored = readStoredCode();
    codeRef.current = stored;
    setAccessCode(stored);
  }, []);

  const saveAccessCode = useCallback((code: string) => {
    codeRef.current = code;
    writeStoredCode(code);
    setAccessCode(code);
  }, []);

  const forgetAccessCode = useCallback(() => {
    codeRef.current = undefined;
    writeStoredCode(undefined);
    setAccessCode(undefined);
  }, []);

  const append = useCallback((event: DemoEvent) => {
    setState((current) => {
      if (current.status === 'idle') return current;
      const events = [...current.events, event];
      if (event.type === 'done') return { ...current, events, status: 'done', finishedAt: Date.now() };
      if (event.type === 'failed') return { ...current, events, status: 'failed', finishedAt: Date.now() };
      return { ...current, events };
    });
  }, []);

  const start = useCallback(
    (request: RunRequest, label: string) => {
      if (running.current) return;
      running.current = true;
      setRunActive(true);
      setState({ status: 'running', label, events: [], startedAt: Date.now() });

      void (async () => {
        let finished = false;
        try {
          const response = await fetch('/api/runs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', [ACCESS_CODE_HEADER]: codeRef.current ?? '' },
            body: JSON.stringify(request),
          });
          if (response.status === 401) forgetAccessCode();
          if (!response.ok || response.body === null) {
            append({ type: 'failed', text: await readError(response) });
            finished = true;
            return;
          }
          const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
          let buffer = '';
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            buffer += value;
            let newline = buffer.indexOf('\n');
            while (newline >= 0) {
              const event = parseLine(buffer.slice(0, newline));
              buffer = buffer.slice(newline + 1);
              if (event !== undefined) {
                append(event);
                if (event.type === 'done' || event.type === 'failed') finished = true;
                const toast = TOASTS[request.kind];
                if (event.type === 'done' && toast !== undefined) notify(toast);
              }
              newline = buffer.indexOf('\n');
            }
          }
        } catch {
          // Reported below as a lost connection.
        } finally {
          if (!finished) append({ type: 'failed', text: LOST_CONNECTION });
          running.current = false;
          // The refresh runs as a transition, so the run counts as busy until the new data has rendered.
          startRefresh(() => {
            router.refresh();
          });
          setRunActive(false);
        }
      })();
    },
    [append, router, forgetAccessCode, notify],
  );

  const dismiss = useCallback(() => {
    if (!running.current) setState({ status: 'idle' });
  }, []);

  return (
    <RunContext.Provider value={{ state, busy, accessCode, saveAccessCode, forgetAccessCode, start, dismiss }}>
      {children}
    </RunContext.Provider>
  );
}

export function useRun(): RunContextValue {
  const value = useContext(RunContext);
  if (value === null) throw new Error('useRun must be used inside RunProvider');
  return value;
}
