import { unixTimeToRippleTime, type Payment, type Wallet } from 'xrpl';
import { SignedAdminActionSchema, verifyAdminAction } from '../domain/admin-action.ts';
import { formatUnits, toUnits } from '../domain/amount.ts';
import { AGENT_MANDATE_CREDENTIAL_TYPE, checkCredential, type CredentialCheck } from '../domain/credential-check.ts';
import { decide, utcDay } from '../domain/decision.ts';
import { fingerprintOf, JsonSchema, mandateFingerprint } from '../domain/fingerprint.ts';
import type { Mandate } from '../domain/mandate.ts';
import { readUnsignedPayment, type PaymentFacts } from '../domain/payment-facts.ts';
import { AdminReason, PolicyReason } from '../domain/reasons.ts';
import { agentCredentialQuery, type CredentialQuery } from '../ledger/credential.ts';
import type { FoundCredential } from '../ledger/reads.ts';
import { signPart } from '../ledger/submit.ts';
import { appendOnlyLog, collection, type DocumentStore } from '../storage/store.ts';
import {
  ApprovalRecordSchema,
  MandateRecordSchema,
  PolicyLogEntrySchema,
  type ApprovalRecord,
  type PolicyLogEntry,
} from './records.ts';

export interface PolicyServiceDeps {
  /** The policy key. It signs nothing but payments that pass every rule. */
  wallet: Wallet;
  /** The policy service's own store. No other service writes to it. */
  store: DocumentStore;
  issuerAddress: string;
  /** Reads the agent's credential from the validated ledger. */
  readCredential: (query: CredentialQuery) => Promise<FoundCredential | undefined>;
  now?: () => Date;
}

export interface ReviewRequest {
  /** The autofilled, unsigned payment. Untrusted. */
  payment: unknown;
  /** Why the agent is paying. Untrusted text, kept as data only. */
  purpose: unknown;
}

export type ReviewResult = { decision: 'signed'; signature: string } | { decision: 'refused'; reasons: PolicyReason[] };

export type AdminResult = { applied: true } | { applied: false; reason: AdminReason };

export interface PolicyService {
  review(request: ReviewRequest): Promise<ReviewResult>;
  applyAdminAction(signed: unknown): Promise<AdminResult>;
  currentMandate(agent: string): Promise<Mandate | undefined>;
  /** The RLUSD co-signed for this agent today (UTC), as a decimal string. */
  todaysTotal(agent: string): Promise<string>;
  readLog(): Promise<PolicyLogEntry[]>;
  /** Demo only: forget today's co-signed totals. Logged like any other change. */
  clearDailyTotalsForDemo(): Promise<void>;
}

const PURPOSE_LIMIT = 280;
const DETAIL_LIMIT = 200;

/**
 * Treats the request as it would arrive over the wire: plain JSON only.
 * Undefined fields disappear and anything that cannot be serialised is refused.
 */
function asWireData(value: unknown): unknown {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(value)) as unknown;
  } catch {
    return undefined;
  }
}

export function createPolicyService(deps: PolicyServiceDeps): PolicyService {
  const clock = deps.now ?? (() => new Date());
  const mandates = collection(deps.store, 'mandates', MandateRecordSchema);
  const approvals = collection(deps.store, 'approvals', ApprovalRecordSchema);
  const log = appendOnlyLog(deps.store, 'decisions', PolicyLogEntrySchema);

  async function refuse(
    at: Date,
    facts: PaymentFacts | undefined,
    purpose: string,
    reasons: PolicyReason[],
    detail?: string,
  ): Promise<ReviewResult> {
    await log.append({
      detail,
      kind: 'review',
      at: at.toISOString(),
      agent: facts?.account,
      decision: 'refused',
      reasons,
      invoiceId: facts?.invoiceId,
      destination: facts?.destination,
      destinationTag: facts?.destinationTag,
      amount: facts?.amount?.value,
      purpose,
    });
    return { decision: 'refused', reasons };
  }

  async function readCredentialCheck(agent: string, mandate: Mandate, at: Date): Promise<CredentialCheck | undefined> {
    const found = await deps.readCredential(agentCredentialQuery(agent, deps.issuerAddress));
    if (found === undefined) return undefined;
    return checkCredential(
      found.entry,
      {
        issuer: deps.issuerAddress,
        subject: agent,
        credentialType: AGENT_MANDATE_CREDENTIAL_TYPE,
        fingerprint: mandateFingerprint(mandate),
      },
      unixTimeToRippleTime(at.getTime()),
    );
  }

  async function review(request: ReviewRequest): Promise<ReviewResult> {
    const at = clock();
    const purpose = typeof request.purpose === 'string' ? request.purpose.slice(0, PURPOSE_LIMIT) : '';
    const read = readUnsignedPayment(asWireData(request.payment));
    if (!read.ok) return refuse(at, undefined, purpose, [PolicyReason.MalformedPayment]);
    const { facts, payment } = read;

    try {
      const record = await mandates.get(facts.account);
      // The credential is read from the ledger before every signature, never from a cache.
      const credential = record === undefined ? undefined : await readCredentialCheck(facts.account, record.mandate, at);
      const day = utcDay(at);
      const paymentDigest = fingerprintOf(JsonSchema.parse(payment));
      const existing = facts.invoiceId === undefined ? undefined : await approvals.get(facts.invoiceId);
      if (existing !== undefined && existing.paymentDigest !== paymentDigest) {
        return await refuse(at, facts, purpose, [PolicyReason.DuplicateReference]);
      }

      const approvalsToday = (await approvals.list()).filter(
        (approval) => approval.agent === facts.account && approval.day === day && approval.invoiceId !== facts.invoiceId,
      );
      const decision = decide({ facts, purpose, mandate: record?.mandate, credential, approvalsToday, now: at });
      if (!decision.approve) return await refuse(at, facts, purpose, decision.reasons);
      if (facts.invoiceId === undefined || facts.amount === undefined) {
        return await refuse(at, facts, purpose, [PolicyReason.MalformedPayment]);
      }

      // The payment passed the strict schema and every rule; xrpl.js validates it again when signing.
      const signature = signPart(deps.wallet, payment as Payment);
      const approval: ApprovalRecord = {
        invoiceId: facts.invoiceId,
        agent: facts.account,
        destination: facts.destination,
        destinationTag: facts.destinationTag,
        amount: facts.amount.value,
        day,
        approvedAt: at.toISOString(),
        paymentDigest,
      };
      await approvals.put(facts.invoiceId, approval);
      await log.append({
        kind: 'review',
        at: at.toISOString(),
        agent: facts.account,
        decision: 'signed',
        reasons: [],
        invoiceId: facts.invoiceId,
        destination: facts.destination,
        destinationTag: facts.destinationTag,
        amount: facts.amount.value,
        purpose,
      });
      return { decision: 'signed', signature };
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message.slice(0, DETAIL_LIMIT) : 'Unknown error';
      return refuse(at, facts, purpose, [PolicyReason.ServiceError], detail);
    }
  }

  async function rejectAdmin(at: Date, reason: AdminReason, agent?: string, signer?: string): Promise<AdminResult> {
    await log.append({
      kind: 'admin',
      at: at.toISOString(),
      action: 'set-mandate',
      decision: 'rejected',
      reasons: [reason],
      agent,
      signer,
    });
    return { applied: false, reason };
  }

  async function applyAdminAction(input: unknown): Promise<AdminResult> {
    const at = clock();
    const verification = verifyAdminAction(input);
    const parsed = SignedAdminActionSchema.safeParse(input);
    if (!verification.valid || !parsed.success) return rejectAdmin(at, AdminReason.BadSignature);

    const { mandate, issuedAt } = parsed.data.action;
    const { signer } = verification;
    // Only the business named in the mandate may set it. An agent signing for itself is rejected here.
    if (signer !== mandate.principal) return rejectAdmin(at, AdminReason.SignerNotPrincipal, mandate.agent, signer);

    const existing = await mandates.get(mandate.agent);
    if (existing !== undefined && existing.mandate.principal !== mandate.principal) {
      return rejectAdmin(at, AdminReason.PrincipalChangeNotAllowed, mandate.agent, signer);
    }
    if (existing !== undefined && Date.parse(issuedAt) <= Date.parse(existing.issuedAt)) {
      return rejectAdmin(at, AdminReason.StaleAction, mandate.agent, signer);
    }

    await mandates.put(mandate.agent, { mandate, issuedAt, signer });
    await log.append({
      kind: 'admin',
      at: at.toISOString(),
      action: 'set-mandate',
      decision: 'applied',
      reasons: [],
      agent: mandate.agent,
      signer,
    });
    return { applied: true };
  }

  return {
    review,
    applyAdminAction,
    async currentMandate(agent) {
      return (await mandates.get(agent))?.mandate;
    },
    async todaysTotal(agent) {
      const day = utcDay(clock());
      const today = (await approvals.list()).filter((approval) => approval.agent === agent && approval.day === day);
      return formatUnits(today.reduce((total, approval) => total + toUnits(approval.amount), 0n));
    },
    readLog: () => log.readAll(),
    async clearDailyTotalsForDemo() {
      await approvals.clear();
      await log.append({
        kind: 'admin',
        at: clock().toISOString(),
        action: 'clear-daily-totals-for-demo',
        decision: 'applied',
        reasons: [],
      });
    },
  };
}
