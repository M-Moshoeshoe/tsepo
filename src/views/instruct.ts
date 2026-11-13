import { outcomeNote, readNote } from './assistant.ts';
import { paymentDecision, STATUS_LABELS, STATUS_TONES, type Instruction } from './payments.ts';
import type { DailyUsage } from './usage.ts';

/** The newest instruction, with Thuso's words and each decision worked out from the records, for the result panel. */
export interface LatestInstruction {
  at: string;
  /** The instruction as the agent received it, shown as data, never followed. */
  text: string;
  /** Thuso's reply: what it read. */
  note: string;
  payments: {
    id: string;
    href: string;
    label: string;
    status: { label: string; tone: 'cleared' | 'held' | 'refused' | 'neutral' };
    decision: { text: string; decidedBy: string } | undefined;
    outcome: string | undefined;
  }[];
}

export function latestInstruction(instruction: Instruction | undefined, hrefFor: (paymentId: string) => string): LatestInstruction | undefined {
  if (instruction === undefined) return undefined;
  return {
    at: instruction.at,
    text: instruction.text,
    note: readNote(instruction.intents),
    payments: instruction.payments.map((payment) => ({
      id: payment.id,
      href: hrefFor(payment.id),
      label: `${payment.intent.amount} RLUSD to ${payment.intent.payee}`,
      status: { label: STATUS_LABELS[payment.status], tone: STATUS_TONES[payment.status] },
      decision: paymentDecision(payment),
      outcome: outcomeNote(payment),
    })),
  };
}

/** "Today: 3 of 5 RLUSD left. Up to 3 RLUSD per payment.", or why the agent cannot pay. */
export function allowanceLine(input: { state: 'active' | 'revoked' | 'mismatch' | 'not-registered'; usage: DailyUsage | undefined; perPaymentLimit: string | undefined }): string {
  if (input.state === 'revoked') return 'Your agent is revoked, so it cannot pay. Register it again from the Agent page.';
  if (input.state !== 'active' || input.usage === undefined || input.perPaymentLimit === undefined) {
    return 'Your agent has no valid spending rules, so it cannot pay. Register it again from the Agent page.';
  }
  return `Today: ${input.usage.left} of ${input.usage.limit} RLUSD left. Up to ${input.perPaymentLimit} RLUSD per payment.`;
}
