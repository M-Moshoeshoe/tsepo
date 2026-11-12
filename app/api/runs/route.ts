import { Client } from 'xrpl';
import type { DemoEvent } from '../../../src/demo/events.ts';
import { RunRequestSchema } from '../../../src/demo/events.ts';
import { runDemo } from '../../../src/demo/runs.ts';
import { TESTNET_URL } from '../../../src/ledger/testnet.ts';
import { guardRun } from './guard.ts';
import { acquireRunLock, releaseRunLock } from './lock.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function errorResponse(status: number, message: string): Response {
  return Response.json({ error: message }, { status });
}

function plainError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Unknown error';
  return `${message} Nothing further was submitted.`;
}

/**
 * Runs one demo action and streams its progress as JSON lines. The engine,
 * the seeds and the Anthropic key stay on the server; the browser receives
 * progress text and transaction hashes only.
 */
export async function POST(request: Request): Promise<Response> {
  const refused = guardRun(request);
  if (refused !== undefined) return refused;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse(400, 'The request was not valid JSON.');
  }
  const parsed = RunRequestSchema.safeParse(body);
  if (!parsed.success) return errorResponse(400, parsed.error.issues[0]?.message ?? 'The request was not valid.');
  if (!acquireRunLock()) return errorResponse(409, 'Another run is in progress. Wait for it to finish, then try again.');

  const encoder = new TextEncoder();
  let open = true;
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: DemoEvent): void => {
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
        send({ type: 'failed', text: plainError(error) });
      } finally {
        if (client.isConnected()) await client.disconnect();
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
