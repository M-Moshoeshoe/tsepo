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
        tx_json: z.object({ TransactionType: z.string() }).loose(),
        meta: z.object({ TransactionResult: z.string() }).loose(),
      }),
    ),
    marker: z.unknown().optional(),
  }),
});

/** The newest successful transaction of a type on an account, searching back up to a few pages. */
async function newestOfType(client: Client, account: string, type: string): Promise<string | undefined> {
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
      (item) => item.validated === true && item.tx_json.TransactionType === type && item.meta.TransactionResult === 'tesSUCCESS',
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
  const { agent, issuer, exchange } = ctx.wallets;
  const history = await getCredentialHistory(client, agentCredentialQuery(agent.address, issuer.address));
  const newest = (type: string): string | undefined => history.find((event) => event.type === type)?.hash;
  const deposits = (await ctx.exchange.deposits()).filter((deposit) => deposit.status === 'Cleared').sort((a, b) => b.ledgerIndex - a.ledgerIndex);
  const rejections = (await ctx.exchange.ledgerRejections()).sort((a, b) => b.ledgerIndex - a.ledgerIndex);

  const found: Record<ProofKey, string | undefined> = {
    'credential-issued': newest('CredentialCreate'),
    'credential-accepted': newest('CredentialAccept'),
    'deposit-authorization': await newestOfType(client, exchange.address, 'DepositPreauth'),
    'signer-list': await newestOfType(client, agent.address, 'SignerListSet'),
    'approved-payment': deposits[0]?.hash,
    'ledger-rejection': rejections[0]?.hash,
    revocation: newest('CredentialDelete'),
  };
  const missing = Object.entries(found).filter(([, hash]) => hash === undefined).map(([key]) => key);
  if (missing.length > 0) throw new Error(`No transaction found for: ${missing.join(', ')}. Run the four tour stories first.`);

  const file = ProofFileSchema.parse({ capturedAt: new Date().toISOString(), network: 'XRP Ledger Testnet', transactions: found });
  await writeFile(OUT, `${JSON.stringify(file, null, 2)}\n`);
  console.log(`saved ${OUT}`);
} finally {
  await client.disconnect();
}
