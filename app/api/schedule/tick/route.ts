import { createHash, timingSafeEqual } from 'node:crypto';
import { join } from 'node:path';
import { Client } from 'xrpl';
import { dataDir } from '../../../../src/config/env.ts';
import { createDemoContext } from '../../../../src/demo/context.ts';
import { plainRunError } from '../../../../src/demo/errors.ts';
import { runDemo } from '../../../../src/demo/runs.ts';
import { agentCredentialQuery } from '../../../../src/ledger/credential.ts';
import { findCredential } from '../../../../src/ledger/reads.ts';
import { TESTNET_URL } from '../../../../src/ledger/testnet.ts';
import { runScheduledTurn } from '../../../../src/schedule/scheduler.ts';
import { scheduleStore } from '../../../../src/schedule/store.ts';
import { SCHEDULE_TOKEN_HEADER, scheduleToken } from '../../../../src/schedule/timer.ts';
import { createFileStore } from '../../../../src/storage/file-store.ts';
import { agentStatus } from '../../../_data/registry.ts';
import { takeRunSlot } from '../../runs/guard.ts';
import { beginRun, endRun } from '../../runs/current.ts';
import { acquireRunLock, isRunLocked, releaseRunLock } from '../../runs/lock.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

/** Only this server's own timer may start a scheduled turn: it alone knows the per-process token. */
function fromOwnTimer(request: Request): boolean {
  const expected = scheduleToken();
  const given = request.headers.get(SCHEDULE_TOKEN_HEADER);
  return expected !== undefined && given !== null && timingSafeEqual(digest(expected), digest(given));
}

/**
 * One turn of the payout schedule, asked for by the server's own timer. The
 * agent processes the instruction inbox by itself when the schedule allows,
 * through the same run lock, hourly limit, Claude limit and agent as a run a
 * person starts. Visitors can follow it like any other run.
 */
export async function POST(request: Request): Promise<Response> {
  if (!fromOwnTimer(request)) return new Response(null, { status: 404 });

  const client = new Client(TESTNET_URL);
  const connect = async (): Promise<Client> => {
    if (!client.isConnected()) await client.connect();
    return client;
  };
  try {
    const result = await runScheduledTurn({
      store: scheduleStore(createFileStore(join(dataDir(), 'schedule'))),
      now: () => new Date(),
      isRunActive: isRunLocked,
      acquireLock: acquireRunLock,
      releaseLock: releaseRunLock,
      takeRunSlot: () => takeRunSlot() === undefined,
      async agentActive() {
        const ctx = createDemoContext(await connect(), () => undefined);
        const agent = ctx.wallets.agent.address;
        const issuer = ctx.wallets.issuer.address;
        const [credential, mandate] = await Promise.all([findCredential(ctx.client, agentCredentialQuery(agent, issuer)), ctx.policy.currentMandate(agent)]);
        return agentStatus({ credential, history: [], mandate, issuer, agent }).state === 'active';
      },
      async runInstruction(text) {
        const record = beginRun('instruction');
        try {
          await runDemo({ kind: 'instruction', text }, await connect(), record, createDemoContext, 'schedule');
        } catch (error: unknown) {
          record({ type: 'failed', text: `${plainRunError(error)} Nothing further was submitted.` });
          throw error;
        } finally {
          endRun();
        }
      },
      log: (line) => {
        console.error(line);
      },
    });
    if (result.ran > 0 || result.stoppedBy !== undefined) console.log(`[schedule] processed ${String(result.ran)} instruction(s)${result.stoppedBy === undefined ? '' : `, stopped by ${result.stoppedBy}`}`);
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    console.error('[schedule] the scheduled turn stopped', error instanceof Error ? error.message : 'unknown error');
    return Response.json({ error: 'The scheduled turn stopped.' }, { status: 500 });
  } finally {
    if (client.isConnected()) await client.disconnect();
  }
}
