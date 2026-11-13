import { writeFile } from 'node:fs/promises';
import { Client } from 'xrpl';
import { z } from 'zod';
import { createDemoContext } from '../src/demo/context.ts';
import { agentCredentialQuery } from '../src/ledger/credential.ts';
import { getCredentialHistory } from '../src/ledger/reads.ts';
import { TESTNET_URL } from '../src/ledger/testnet.ts';
import { ProofFileSchema, type ProofKey } from '../src/views/proof.ts';

/**
 * Finds one real Testnet transaction for each XRP Ledger feature the landing
 * page proves, and writes src/views/proof.json. Read-only: it signs nothing.
 * Run after Restore and the four tour stories: npm run proof:capture
 */
const OUT = 'src/views/proof.json';

const AccountTxSchema = z.object({
  result: z.object({
    transactions: z.array(
      z.object({
        hash: z.string(),
        validated: z.boolean().optional(),
        tx_json: z.object({ TransactionType: z.string(), Account: z.string().optional(), Destination: z.string().optional() }).loose(),
        meta: z.object({ TransactionResult: z.string() }).loose(),
      }),
    ),
    marker: z.unknown().optional(),
  }),
});

const TxSchema = z.object({
  result: z.object({
    validated: z.literal(true),
    ledger_index: z.number().int(),
    close_time_iso: z.string(),
    meta: z.object({ TransactionResult: z.string() }).loose(),
    tx_json: z
      .object({
        SignerQuorum: z.number().int().optional(),
        SignerEntries: z.array(z.object({ SignerEntry: z.object({ Account: z.string(), SignerWeight: z.number().int() }) })).optional(),
      })
      .loose(),
  }),
});

/** One validated transaction, as the ledger recorded it. */
async function readTx(client: Client, hash: string): Promise<z.infer<typeof TxSchema>['result']> {
  return TxSchema.parse(await client.request({ command: 'tx', transaction: hash })).result;
}

interface TxMatch {
  type: string;
  result: string;
  from?: string;
  to?: string;
}

/**
 * The newest validated transaction on an account that matches the type, the
 * result and, when given, the sender and destination, searching back up to a
 * few pages. Every hash comes from the ledger itself, never from local
 * records, so the proof holds whichever machine ran the stories.
 */
async function newestMatching(client: Client, account: string, match: TxMatch): Promise<string | undefined> {
  let marker: unknown = undefined;
  for (let page = 0; page < 10; page += 1) {
    const response = await client.request({
      command: 'account_tx',
      account,
      forward: false,
      ledger_index_min: -1,
      ledger_index_max: -1,
      limit: 200,
      ...(marker === undefined ? {} : { marker }),
    });
    const parsed = AccountTxSchema.parse(response).result;
    const found = parsed.transactions.find(
      (item) =>
        item.validated === true &&
        item.tx_json.TransactionType === match.type &&
        item.meta.TransactionResult === match.result &&
        (match.from === undefined || item.tx_json.Account === match.from) &&
        (match.to === undefined || item.tx_json.Destination === match.to),
    );
    if (found !== undefined) return found.hash;
    marker = parsed.marker;
    if (marker === undefined) return undefined;
  }
  return undefined;
}

const client = new Client(TESTNET_URL);
await client.connect();
try {
  const ctx = createDemoContext(client, () => undefined);
  const { agent, issuer, exchange, unknownAgent } = ctx.wallets;
  const history = await getCredentialHistory(client, agentCredentialQuery(agent.address, issuer.address));
  const newest = (type: string): string | undefined => history.find((event) => event.type === type)?.hash;

  const found: Record<ProofKey, string | undefined> = {
    'credential-issued': newest('CredentialCreate'),
    'credential-accepted': newest('CredentialAccept'),
    'deposit-authorization': await newestMatching(client, exchange.address, { type: 'DepositPreauth', result: 'tesSUCCESS' }),
    'signer-list': await newestMatching(client, agent.address, { type: 'SignerListSet', result: 'tesSUCCESS' }),
    'approved-payment': await newestMatching(client, agent.address, { type: 'Payment', result: 'tesSUCCESS', from: agent.address, to: exchange.address }),
    'ledger-rejection': await newestMatching(client, unknownAgent.address, {
      type: 'Payment',
      result: 'tecNO_PERMISSION',
      from: unknownAgent.address,
      to: exchange.address,
    }),
    revocation: newest('CredentialDelete'),
  };
  const missing = Object.entries(found).filter(([, hash]) => hash === undefined).map(([key]) => key);
  if (missing.length > 0) throw new Error(`No transaction found for: ${missing.join(', ')}. Run the four tour stories first.`);

  const transactions = found as Record<ProofKey, string>;
  const ledger: Partial<Record<ProofKey, { result: string; ledgerIndex: number; closeTime: string }>> = {};
  for (const [key, hash] of Object.entries(transactions) as [ProofKey, string][]) {
    const tx = await readTx(client, hash);
    ledger[key] = { result: tx.meta.TransactionResult, ledgerIndex: tx.ledger_index, closeTime: tx.close_time_iso };
  }
  const signerTx = await readTx(client, transactions['signer-list']);
  const weightOf = (address: string): number =>
    signerTx.tx_json.SignerEntries?.find((entry) => entry.SignerEntry.Account === address)?.SignerEntry.SignerWeight ?? 0;
  const file = ProofFileSchema.parse({
    capturedAt: new Date().toISOString(),
    network: 'XRP Ledger Testnet',
    transactions,
    ledger,
    signerList: {
      quorum: signerTx.tx_json.SignerQuorum,
      weights: { business: weightOf(ctx.wallets.business.address), agent: weightOf(ctx.wallets.agentSigner.address), approvalService: weightOf(ctx.policyAddress) },
    },
  });
  await writeFile(OUT, `${JSON.stringify(file, null, 2)}\n`);
  console.log(`saved ${OUT}`);
} finally {
  await client.disconnect();
}
