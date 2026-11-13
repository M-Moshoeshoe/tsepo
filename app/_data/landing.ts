import 'server-only';
import { join } from 'node:path';
import type { PayoutIntent } from '../../src/agent/payout-parser.ts';
import { agentRecords } from '../../src/agent/records.ts';
import { dataDir } from '../../src/config/env.ts';
import { SPLIT_PAYOUTS } from '../../src/demo/payout-lists.ts';
import { DepositRecordSchema, LedgerRejectionSchema } from '../../src/exchange/exchange-verifier.ts';
import { loadAppEnv } from '../../src/config/app-env.ts';
import { createPolicyClient } from '../../src/policy/http-client.ts';
import { PolicyLogEntrySchema, type PolicyLogEntry } from '../../src/policy/records.ts';
import { createFileStore } from '../../src/storage/file-store.ts';
import { appendOnlyLog, collection } from '../../src/storage/store.ts';
import { readNote } from '../../src/views/assistant.ts';
import { instructionsFrom } from '../../src/views/payments.ts';
import { proofNumbers, type ProofNumbers } from '../../src/views/proof-numbers.ts';
import { loadProof, type ProofFile } from '../../src/views/proof.ts';

/** A real instruction Thuso read on Testnet, the fields it found, and its note. */
export interface ThusoExample {
  instruction: string;
  intents: PayoutIntent[];
  note: string;
}

export interface LandingData {
  proof: ProofFile;
  numbers: ProofNumbers;
  thuso: ThusoExample | undefined;
}

/**
 * Everything the landing page shows that comes from evidence: the committed
 * ledger proof and the service records on disk. No ledger connection, so the
 * page stays fast; every record is checked with Zod as it is read. Thuso's
 * example is only ever the tour's own fixed instruction, so text a visitor
 * typed never appears on the public page.
 */
/**
 * The approval service's log: from its own deployment when it runs on its
 * own, otherwise from its folder on this machine. The page is also built
 * ahead of time, when the private network is not reachable yet; then it
 * shows the ledger table without figures until the next refresh.
 */
async function readPolicyLog(root: string): Promise<PolicyLogEntry[]> {
  if (process.env.POLICY_SERVICE_URL === undefined || process.env.POLICY_SERVICE_URL === '') {
    return appendOnlyLog(createFileStore(join(root, 'policy')), 'decisions', PolicyLogEntrySchema).readAll();
  }
  try {
    const env = loadAppEnv();
    if (env.policy.mode !== 'service') return [];
    return await createPolicyClient({ url: env.policy.url, token: env.policy.token }).readLog();
  } catch (error: unknown) {
    console.error('[landing] the approval service log could not be read', error instanceof Error ? error.message : 'unknown error');
    return [];
  }
}

export async function loadLandingData(): Promise<LandingData> {
  const root = dataDir();
  const agent = agentRecords(createFileStore(join(root, 'agent')));
  const exchangeStore = createFileStore(join(root, 'exchange'));
  const rejections = collection(exchangeStore, 'ledger-rejections', LedgerRejectionSchema);
  const deposits = collection(exchangeStore, 'deposits', DepositRecordSchema);
  const [log, events, runs, rejected, received] = await Promise.all([
    readPolicyLog(root),
    agent.events.readAll(),
    agent.runs.list(),
    rejections.list(),
    deposits.list(),
  ]);

  const proof = loadProof();
  const split = instructionsFrom(runs, events).find((instruction) => instruction.text === SPLIT_PAYOUTS && instruction.intents.length > 0);
  return {
    proof,
    numbers: proofNumbers({
      proof,
      policyLog: log,
      agentEvents: events,
      ledgerRejections: rejected.map((item) => ({ hash: item.hash, at: item.closeTimeIso ?? item.recordedAt })),
      depositInvoices: received.map((deposit) => deposit.invoiceId),
    }),
    thuso: split === undefined ? undefined : { instruction: split.text, intents: split.intents, note: readNote(split.intents) },
  };
}
