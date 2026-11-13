/**
 * The policy (approval) service on its own: npm run policy:serve.
 *
 * It holds the policy key and nothing else. It listens on the private
 * network only (no public domain on Railway), and every request but /health
 * needs the shared token. It reads each agent's credential from the
 * validated XRP Ledger before it signs, and keeps its records on its own
 * volume. It logs its address and each request's method, path and status,
 * never a body, a token or a key.
 */
import { createServer, type IncomingMessage } from 'node:http';
import { join } from 'node:path';
import { Client, Wallet } from 'xrpl';
import { findCredential } from '../ledger/reads.ts';
import { TESTNET_URL } from '../ledger/testnet.ts';
import { createFileStore } from '../storage/file-store.ts';
import { createPolicyHandler } from './http-handler.ts';
import { createPolicyService } from './policy-service.ts';
import { loadPolicyServerEnv } from './server-env.ts';

const MAX_BODY_BYTES = 64 * 1024;

const env = loadPolicyServerEnv();
const wallet = Wallet.fromSeed(env.seed);
const client = new Client(TESTNET_URL);

/** One connection, opened on first use and again whenever it drops. */
async function connected(): Promise<Client> {
  if (!client.isConnected()) await client.connect();
  return client;
}

const service = createPolicyService({
  wallet,
  store: createFileStore(join(env.dataDir, 'policy')),
  issuerAddress: env.issuerAddress,
  readCredential: async (query) => findCredential(await connected(), query),
});
const handle = createPolicyHandler(service, env.token);

/** Requests run one at a time, so two reviews can never both pass the same daily limit. */
let queue: Promise<unknown> = Promise.resolve();
function inTurn<T>(work: () => Promise<T>): Promise<T> {
  const next = queue.then(work, work);
  queue = next.catch(() => undefined);
  return next;
}

async function readBody(request: IncomingMessage): Promise<string | undefined> {
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
    size += buffer.length;
    if (size > MAX_BODY_BYTES) return undefined;
    chunks.push(buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

const server = createServer((request, response) => {
  void (async () => {
    let status = 500;
    let body: unknown = { error: 'The policy service could not answer' };
    try {
      const text = await readBody(request);
      if (text === undefined) {
        status = 413;
        body = { error: 'The request is too large' };
      } else {
        const answer = await inTurn(() =>
          handle({ method: request.method ?? 'GET', url: request.url ?? '/', authorization: request.headers.authorization, body: text }),
        );
        status = answer.status;
        body = answer.body;
      }
    } catch (error: unknown) {
      console.error('[policy] request failed', error instanceof Error ? error.name : 'unknown error');
    }
    response.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    response.end(JSON.stringify(body));
    console.log(`[policy] ${request.method ?? '?'} ${(request.url ?? '/').split('?')[0] ?? '/'} ${String(status)}`);
  })();
});

// "::" listens on IPv6 and IPv4, which Railway's private network needs.
server.listen(env.port, '::', () => {
  console.log('[policy] listening', { address: wallet.address, port: env.port });
});
