import 'server-only';
import { DEMO_AGENT_NAME } from '../../src/config/demo.ts';
import type { DemoContext } from '../../src/demo/context.ts';
import { PolicyReason } from '../../src/domain/reasons.ts';
import { agentCredentialQuery } from '../../src/ledger/credential.ts';
import { getCredentialHistory, type CredentialEvent } from '../../src/ledger/reads.ts';
import type { DepositRecord } from '../../src/exchange/exchange-verifier.ts';
import type { Actor } from '../../src/demo/events.ts';
import { UNREGISTERED_AGENT } from '../../src/views/desk.ts';
import { decidedBy } from '../../src/views/payment-events.ts';
import { depositStatus, LEDGER_REJECTION_STATUS, refusalStatus, type Status } from '../../src/views/status.ts';

export interface DeskEntry {
  id: string;
  kind: 'deposit' | 'refusal' | 'rejection';
  at: string;
  sender: string;
  /** A readable name for the sender when the demo knows the account. */
  senderName: string;
  amount: string | undefined;
  asset: string | undefined;
  status: Status;
  decidedBy: Actor;
  reasons: string[];
  hash: string | undefined;
  invoiceId: string | undefined;
  ledgerResult: string | undefined;
}

export interface DeskEntries {
  entries: DeskEntry[];
  deposits: DepositRecord[];
  lastResetAt: string | undefined;
}

/** The latest revocation of the agent credential at or before `at`. */
function revokedBefore(history: CredentialEvent[], at: string): string | undefined {
  return history.find((event) => event.type === 'CredentialDelete' && event.closeTimeIso !== undefined && event.closeTimeIso <= at)
    ?.closeTimeIso;
}

/** Every payment into the agent lane and every attempt stopped before it, in no particular order. */
export async function collectDeskEntries(ctx: DemoContext): Promise<DeskEntries> {
  const { client, wallets, exchange } = ctx;
  const [deposits, refusals, rejections, history, lastResetAt] = await Promise.all([
    exchange.deposits(),
    exchange.refusedAttempts(),
    exchange.ledgerRejections(),
    getCredentialHistory(client, agentCredentialQuery(wallets.agent.address, wallets.issuer.address)),
    ctx.demo.lastResetAt(),
  ]);

  const nameOf = (address: string | undefined): string => {
    if (address === wallets.agent.address) return DEMO_AGENT_NAME;
    if (address === wallets.unknownAgent.address) return UNREGISTERED_AGENT;
    return 'Unknown account';
  };

  const entries: DeskEntry[] = [
    ...deposits.map((deposit) => ({
      id: `d-${deposit.hash}`,
      kind: 'deposit' as const,
      at: deposit.closeTimeIso ?? deposit.recordedAt,
      sender: deposit.sender,
      senderName: nameOf(deposit.sender),
      amount: deposit.amount,
      asset: deposit.asset,
      status: depositStatus(deposit),
      decidedBy: decidedBy('deposit'),
      reasons: deposit.reasons,
      hash: deposit.hash,
      invoiceId: deposit.invoiceId,
      ledgerResult: deposit.ledgerResult,
    })),
    ...refusals.map((refusal) => {
      const revokedAt =
        refusal.agent === wallets.agent.address && refusal.reasons.includes(PolicyReason.CredentialMissing)
          ? revokedBefore(history, refusal.at)
          : undefined;
      return {
        id: `r-${refusal.at}`,
        kind: 'refusal' as const,
        at: refusal.at,
        sender: refusal.agent ?? 'Unknown account',
        senderName: nameOf(refusal.agent),
        amount: refusal.amount,
        asset: refusal.asset,
        status: refusalStatus(refusal.reasons, revokedAt),
        decidedBy: decidedBy('refusal'),
        reasons: refusal.reasons,
        hash: undefined,
        invoiceId: refusal.invoiceId,
        ledgerResult: undefined,
      };
    }),
    ...rejections.map((rejection) => ({
      id: `x-${rejection.hash}`,
      kind: 'rejection' as const,
      at: rejection.closeTimeIso ?? rejection.recordedAt,
      sender: rejection.sender,
      senderName: nameOf(rejection.sender),
      amount: rejection.amount,
      asset: rejection.asset,
      status: LEDGER_REJECTION_STATUS,
      decidedBy: decidedBy('rejection'),
      reasons: [rejection.ledgerResult],
      hash: rejection.hash,
      invoiceId: undefined,
      ledgerResult: rejection.ledgerResult,
    })),
  ];

  return { entries, deposits, lastResetAt };
}
