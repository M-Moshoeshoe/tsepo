import type { Client } from 'xrpl';
import { z } from 'zod';
import { AGENT_MANDATE_CREDENTIAL_TYPE } from '../domain/credential-check.ts';
import { assessDeposit, type PresentedCredential } from '../domain/deposit-assessment.ts';
import { Directive9PackageSchema, packageFingerprint } from '../domain/directive9.ts';
import { fingerprintToInvoiceId } from '../domain/fingerprint.ts';
import type { PolicyLogEntry, ReviewLogEntry } from '../policy/records.ts';
import { getCredentialById, getIncomingPayments, getValidatedLedgerIndex, type LedgerPayment } from '../ledger/reads.ts';
import { appendOnlyLog, collection, type DocumentStore } from '../storage/store.ts';

const StoredPackageSchema = z.strictObject({
  invoiceId: z.string(),
  fingerprint: z.string(),
  package: Directive9PackageSchema,
  receivedLedgerIndex: z.number().int(),
  receivedAt: z.iso.datetime(),
});

export const DepositRecordSchema = z.strictObject({
  hash: z.string(),
  ledgerIndex: z.number().int(),
  sender: z.string(),
  status: z.enum(['Cleared', 'Held']),
  reasons: z.array(z.string()),
  ledgerResult: z.string(),
  amount: z.string().optional(),
  invoiceId: z.string().optional(),
  packageReference: z.string().optional(),
  recordedAt: z.iso.datetime(),
});

export type DepositRecord = z.infer<typeof DepositRecordSchema>;

const CursorSchema = z.strictObject({ ledgerIndex: z.number().int().nonnegative() });

export interface PackageReceipt {
  invoiceId: string;
  fingerprint: string;
  receivedLedgerIndex: number;
}

export interface ExchangeVerifierDeps {
  client: Client;
  /** The exchange's own store. */
  store: DocumentStore;
  laneAddress: string;
  issuerAddress: string;
  /** Read access to the policy service's log, for refused attempts. */
  readPolicyLog: () => Promise<PolicyLogEntry[]>;
  now?: () => Date;
}

export interface ExchangeVerifier {
  /** Stores a travel package. Rejects anything malformed or meant for another account. */
  receivePackage(input: unknown): Promise<PackageReceipt>;
  /**
   * Reads new payments into the agent lane and records each as Cleared or Held.
   * A payment the ledger rejected never touches the lane account, so it never
   * appears here; refused attempts come from the policy service log instead.
   */
  syncDeposits(): Promise<DepositRecord[]>;
  deposits(): Promise<DepositRecord[]>;
  /** Payments to this lane that the policy service refused to co-sign. */
  refusedAttempts(): Promise<ReviewLogEntry[]>;
}

export function createExchangeVerifier(deps: ExchangeVerifierDeps): ExchangeVerifier {
  const clock = deps.now ?? (() => new Date());
  const packages = collection(deps.store, 'packages', StoredPackageSchema);
  const deposits = collection(deps.store, 'deposits', DepositRecordSchema);
  const cursor = collection(deps.store, 'cursor', CursorSchema);
  const log = appendOnlyLog(deps.store, 'deposit-events', DepositRecordSchema);

  async function receivePackage(input: unknown): Promise<PackageReceipt> {
    const pkg = Directive9PackageSchema.parse(input);
    if (pkg.beneficiary.ledgerAddress !== deps.laneAddress) throw new Error('The package is for another account');
    const fingerprint = packageFingerprint(pkg);
    const invoiceId = fingerprintToInvoiceId(fingerprint);

    const existing = await packages.get(invoiceId);
    if (existing !== undefined) return { invoiceId, fingerprint, receivedLedgerIndex: existing.receivedLedgerIndex };

    const receivedLedgerIndex = await getValidatedLedgerIndex(deps.client);
    await packages.put(invoiceId, { invoiceId, fingerprint, package: pkg, receivedLedgerIndex, receivedAt: clock().toISOString() });
    return { invoiceId, fingerprint, receivedLedgerIndex };
  }

  async function presentedCredential(payment: LedgerPayment): Promise<PresentedCredential | undefined> {
    for (const id of payment.credentialIds) {
      const found = await getCredentialById(deps.client, id);
      if (found?.entry.issuer === deps.issuerAddress && found.entry.credentialType === AGENT_MANDATE_CREDENTIAL_TYPE) {
        return found.entry;
      }
    }
    const first = payment.credentialIds[0];
    return first === undefined ? undefined : (await getCredentialById(deps.client, first))?.entry;
  }

  async function record(payment: LedgerPayment): Promise<DepositRecord> {
    const base = {
      hash: payment.hash,
      ledgerIndex: payment.ledgerIndex,
      sender: payment.sender,
      ledgerResult: payment.result,
      amount: payment.delivered?.value,
      invoiceId: payment.invoiceId,
      recordedAt: clock().toISOString(),
    };
    const stored = payment.invoiceId === undefined ? undefined : await packages.get(payment.invoiceId);
    const assessment = assessDeposit({
      payment,
      received: stored && { package: stored.package, receivedLedgerIndex: stored.receivedLedgerIndex },
      credential: await presentedCredential(payment),
      laneAddress: deps.laneAddress,
      issuerAddress: deps.issuerAddress,
    });
    return {
      ...base,
      packageReference: stored?.package.reference,
      status: assessment.status,
      reasons: assessment.status === 'Held' ? assessment.reasons : [],
    };
  }

  async function syncDeposits(): Promise<DepositRecord[]> {
    const from = (await cursor.get('lane'))?.ledgerIndex ?? 0;
    const payments = await getIncomingPayments(deps.client, deps.laneAddress, from);
    const recorded: DepositRecord[] = [];
    let latest = from;
    for (const payment of payments) {
      latest = Math.max(latest, payment.ledgerIndex);
      if (payment.result !== 'tesSUCCESS' || (await deposits.get(payment.hash)) !== undefined) continue;
      const entry = await record(payment);
      await deposits.put(entry.hash, entry);
      await log.append(entry);
      recorded.push(entry);
    }
    await cursor.put('lane', { ledgerIndex: latest });
    return recorded;
  }

  return {
    receivePackage,
    syncDeposits,
    deposits: () => deposits.list(),
    async refusedAttempts() {
      return (await deps.readPolicyLog()).filter(
        (entry): entry is ReviewLogEntry =>
          entry.kind === 'review' && entry.decision === 'refused' && entry.destination === deps.laneAddress,
      );
    },
  };
}
