import { Client } from 'xrpl';
import type { DemoEvent } from '../../../src/demo/events.ts';
import { RunRequestSchema } from '../../../src/demo/events.ts';
import { plainRunError } from '../../../src/demo/errors.ts';
import { runDemo } from '../../../src/demo/runs.ts';
import { TESTNET_URL } from '../../../src/ledger/testnet.ts';
import { refuseWrongCode, takeRunSlot } from './guard.ts';
import { beginRun, currentRun, endRun } from './current.ts';
import { acquireRunLock, releaseRunLock } from './lock.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errorResponse(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}

/** The browser gets one plain sentence; the raw error goes to the server log only. */
function stoppedText(kind: string, error: unknown): string {
  console.error(`[runs] ${kind} stopped`, error);
  return `${plainRunError(error)} Nothing further was submitted.`;
}

/**
 * Runs one demo action and streams its progress as JSON lines. The engine,
 * the seeds and the Anthropic key stay on the server; the browser receives
 * progress text and transaction hashes only.
 */
export async function POST(request: Request): Promise<Response> {
  const refused = refuseWrongCode(request);
  if (refused !== undefined) return refused;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'The request was not valid JSON.');
  }
  const parsed = RunRequestSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? 'The request was not valid.');
  if (!acquireRunLock()) return errorResponse(409, 'Another visitor is running a step. Wait for it to finish, then try again.');
  const limited = takeRunSlot();
  if (limited !== undefined) {
    releaseRunLock();
    return limited;
  }

  const encoder = new TextEncoder();
  const record = beginRun(parsed.data.kind);
  let open = true;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: DemoEvent): void => {
        record(event);
        if (!open) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
        } catch {
          open = false;
        }
      };
      const client = new Client(TESTNET_URL);
      try {
        await client.connect();
        await runDemo(parsed.data, client, send);
      } catch (error: unknown) {
        send({ type: 'failed', text: stoppedText(parsed.data.kind, error) });
      } finally {
        if (client.isConnected()) await client.disconnect();
        endRun();
        releaseRunLock();
        if (open) controller.close();
      }
    },
    cancel() {
      // The browser went away. The run finishes on the server so the ledger is never left half done.
      open = false;
    },
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

/**
 * The run going on now, so a page refreshed during a run can reattach and
 * follow it to the end. Progress text and hashes only; no code is needed.
 */
export function GET(): Response {
  return Response.json({ run: currentRun() }, { headers: { 'Cache-Control': 'no-store' } });
}
