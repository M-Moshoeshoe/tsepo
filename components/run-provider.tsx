'use client';

import { useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { z } from 'zod';
import { DemoEventSchema, type DemoEvent, type RunRequest } from '../src/demo/events.ts';

export type RunState =
  | { status: 'idle' }
  | { status: 'running' | 'done' | 'failed'; label: string; events: DemoEvent[]; startedAt: number; finishedAt?: number };

interface RunContextValue {
  state: RunState;
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

/** Runs one demo action at a time and keeps its live progress for every component that shows it. */
export function RunProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<RunState>({ status: 'idle' });
  const running = useRef(false);

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
      setState({ status: 'running', label, events: [], startedAt: Date.now() });

      void (async () => {
        let finished = false;
        try {
          const response = await fetch('/api/runs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(request),
          });
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
              }
              newline = buffer.indexOf('\n');
            }
          }
        } catch {
          // Reported below as a lost connection.
        } finally {
          if (!finished) append({ type: 'failed', text: LOST_CONNECTION });
          running.current = false;
          router.refresh();
        }
      })();
    },
    [append, router],
  );

  const dismiss = useCallback(() => {
    if (!running.current) setState({ status: 'idle' });
  }, []);

  return <RunContext.Provider value={{ state, start, dismiss }}>{children}</RunContext.Provider>;
}

export function useRun(): RunContextValue {
  const value = useContext(RunContext);
  if (value === null) throw new Error('useRun must be used inside RunProvider');
  return value;
}
