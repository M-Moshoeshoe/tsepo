import type { Client, Wallet } from 'xrpl';
import type { BusinessIdentity } from '../config/demo.ts';
import { AGENT_MANDATE_CREDENTIAL_TYPE } from '../domain/credential-check.ts';
import { Directive9PackageSchema, packageFingerprint, type Directive9Package } from '../domain/directive9.ts';
import { fingerprintToInvoiceId, mandateFingerprint } from '../domain/fingerprint.ts';
import type { Mandate } from '../domain/mandate.ts';
import { AgentReason } from '../domain/reasons.ts';
import type { ExchangeVerifier } from '../exchange/exchange-verifier.ts';
import { agentCredentialQuery } from '../ledger/credential.ts';
import { findCredential, lookupTransaction } from '../ledger/reads.ts';
import { rlusdPayment } from '../ledger/rlusd.ts';
import { combineParts, prepareTransaction, signPart, submitAndReport } from '../ledger/submit.ts';
import type { PolicyService } from '../policy/policy-service.ts';
import type { DocumentStore } from '../storage/store.ts';
import type { Payee, PayeeDirectory } from './payee-directory.ts';
import type { PayoutIntent, PayoutParser } from './payout-parser.ts';
import { agentRecords, type PayoutRecord } from './records.ts';

export type PayoutResult =
  | { reference: string; status: 'paid'; hash: string; ledgerIndex: number }
  | { reference: string; status: 'refused'; reasons: string[] }
  | { reference: string; status: 'skipped'; reasons: string[] }
  | { reference: string; status: 'failed'; reasons: string[]; hash?: string | undefined };

export type AgentEvent =
  | { type: 'parsed'; intents: PayoutIntent[] }
  | { type: 'package-sent'; reference: string; invoiceId: string; receivedLedgerIndex: number }
  | { type: 'submitting'; reference: string; hash: string }
  | { type: 'result'; result: PayoutResult };

export interface PayoutAgentDeps {
  client: Client;
  agentAddress: string;
  /** The agent signing key: one of two keys a payment needs. The agent never holds the business key. */
  signer: Wallet;
  issuerAddress: string;
  sourceTag: number;
  business: BusinessIdentity;
  parser: PayoutParser;
  directory: PayeeDirectory;
  /** The agent can ask for a co-signature and read its mandate. It cannot change the mandate. */
  policy: Pick<PolicyService, 'review' | 'currentMandate'>;
  exchange: Pick<ExchangeVerifier, 'receivePackage'>;
  /** The agent's own store. */
  store: DocumentStore;
  now?: () => Date;
  onEvent?: (event: AgentEvent) => void;
}

export interface PayoutAgent {
  /** Reads a plain-language payout list and pays each payout it can, in order. Stops at the first error. */
  run(payoutList: string): Promise<PayoutResult[]>;
}

/** Each multisigned agent payment carries two signatures: the agent key and the policy key. */
const SIGNATURES_PER_PAYMENT = 2;

export function createPayoutAgent(deps: PayoutAgentDeps): PayoutAgent {
  const clock = deps.now ?? (() => new Date());
  const { payouts, runs, events: log } = agentRecords(deps.store);

  async function save(record: Omit<PayoutRecord, 'updatedAt'>): Promise<void> {
    const entry = { ...record, updatedAt: clock().toISOString() };
    await payouts.put(record.reference, entry);
    await log.append(entry);
  }

  /** A payout seen before is never sent again blindly: the ledger decides what happened. */
  async function resumeEarlierAttempt(existing: PayoutRecord): Promise<PayoutResult | undefined> {
    const { reference } = existing;
    if (existing.status === 'paid') return { reference, status: 'skipped', reasons: [AgentReason.AlreadyPaid] };
    if (existing.status !== 'signed' || existing.hash === undefined) return undefined;

    const status = await lookupTransaction(deps.client, existing.hash);
    if (status.state === 'validated' && status.result === 'tesSUCCESS') {
      await save({ ...existing, status: 'paid' });
      return { reference, status: 'paid', hash: existing.hash, ledgerIndex: status.ledgerIndex };
    }
    if (status.state === 'validated') {
      await save({ ...existing, status: 'failed', reasons: [status.result] });
      return { reference, status: 'failed', reasons: [status.result], hash: existing.hash };
    }
    return { reference, status: 'skipped', reasons: [AgentReason.Unresolved] };
  }

  function buildPackage(intent: PayoutIntent, payee: Payee, mandate: Mandate): Directive9Package {
    return Directive9PackageSchema.parse({
      version: 1,
      reference: `TSP-${intent.reference}`,
      createdAt: clock().toISOString(),
      originator: { ...deps.business, address: { ...deps.business.address }, ledgerAddress: deps.agentAddress },
      beneficiary: payee,
      transfer: { amount: intent.amount, currency: 'RLUSD', purpose: intent.purpose },
      agent: {
        ledgerAddress: deps.agentAddress,
        credentialIssuer: deps.issuerAddress,
        credentialType: AGENT_MANDATE_CREDENTIAL_TYPE,
        mandate,
        mandateFingerprint: mandateFingerprint(mandate),
      },
    });
  }

  async function pay(intent: PayoutIntent): Promise<PayoutResult> {
    const { reference } = intent;
    const existing = await payouts.get(reference);
    if (existing !== undefined) {
      const resumed = await resumeEarlierAttempt(existing);
      if (resumed !== undefined) return resumed;
    }

    const payee = deps.directory.resolve(intent.payee);
    // Refusals before any package is sent are recorded too, so the business sees every payout it asked for.
    if (payee === undefined) {
      await save({ reference, status: 'refused', reasons: [AgentReason.PayeeUnknown] });
      return { reference, status: 'refused', reasons: [AgentReason.PayeeUnknown] };
    }
    const mandate = await deps.policy.currentMandate(deps.agentAddress);
    if (mandate === undefined) {
      await save({ reference, status: 'refused', reasons: [AgentReason.NoMandate] });
      return { reference, status: 'refused', reasons: [AgentReason.NoMandate] };
    }

    // 1. The travel package goes to the exchange before anything is signed or submitted.
    const pkg = buildPackage(intent, payee, mandate);
    const invoiceId = fingerprintToInvoiceId(packageFingerprint(pkg));
    const receipt = await deps.exchange.receivePackage(pkg);
    if (receipt.invoiceId !== invoiceId) throw new Error('The exchange acknowledged a different package');
    await save({ reference, status: 'package-sent', invoiceId, reasons: [] });
    deps.onEvent?.({ type: 'package-sent', reference, invoiceId, receivedLedgerIndex: receipt.receivedLedgerIndex });

    // 2. Build the payment, sign the agent half, and ask the policy service for the other half.
    const credential = await findCredential(deps.client, agentCredentialQuery(deps.agentAddress, deps.issuerAddress));
    const payment = rlusdPayment(deps.agentAddress, payee.ledgerAddress, intent.amount, {
      destinationTag: payee.destinationTag,
      invoiceId,
      credentialIds: credential === undefined ? undefined : [credential.id],
    });
    const prepared = await prepareTransaction(deps.client, payment, {
      sourceTag: deps.sourceTag,
      signersCount: SIGNATURES_PER_PAYMENT,
    });
    const agentPart = signPart(deps.signer, prepared);
    const review = await deps.policy.review({ payment: prepared, purpose: intent.purpose });
    if (review.decision === 'refused') {
      await save({ reference, status: 'refused', invoiceId, reasons: review.reasons });
      return { reference, status: 'refused', reasons: review.reasons };
    }

    // 3. Submit once. The hash is stored first, and a failure is never retried.
    const signed = combineParts([agentPart, review.signature]);
    const outcome = await submitAndReport(deps.client, signed, async (hash) => {
      await save({ reference, status: 'signed', invoiceId, hash, reasons: [] });
      deps.onEvent?.({ type: 'submitting', reference, hash });
    });
    if (outcome.result !== 'tesSUCCESS') {
      await save({ reference, status: 'failed', invoiceId, hash: outcome.hash, reasons: [outcome.result] });
      return { reference, status: 'failed', reasons: [outcome.result], hash: outcome.hash };
    }
    await save({ reference, status: 'paid', invoiceId, hash: outcome.hash, reasons: [] });
    return { reference, status: 'paid', hash: outcome.hash, ledgerIndex: outcome.ledgerIndex };
  }

  return {
    async run(payoutList) {
      const intents = await deps.parser.parse(payoutList);
      const startedAt = clock().toISOString();
      await runs.put(startedAt, { id: startedAt, startedAt, instruction: payoutList, intents });
      deps.onEvent?.({ type: 'parsed', intents });
      const results: PayoutResult[] = [];
      for (const intent of intents) {
        let result: PayoutResult;
        try {
          result = await pay(intent);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Unknown error';
          await save({ reference: intent.reference, status: 'failed', reasons: [`${AgentReason.Error}: ${message}`] });
          result = { reference: intent.reference, status: 'failed', reasons: [`${AgentReason.Error}: ${message}`] };
        }
        results.push(result);
        deps.onEvent?.({ type: 'result', result });
        if (result.status === 'failed') break;
      }
      return results;
    },
  };
}
