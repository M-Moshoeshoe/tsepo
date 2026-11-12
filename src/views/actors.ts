import type { Actor } from '../demo/events.ts';
import type { Tone } from './status.ts';

const NAMES: Record<Actor, string> = {
  ledger: 'the XRP Ledger',
  policy: 'the approval service',
  exchange: 'the exchange checks',
};

/** "the XRP Ledger", or "The XRP Ledger" at the start of a sentence or a table cell. */
export function actorName(actor: Actor, start = false): string {
  const name = NAMES[actor];
  return start ? name.charAt(0).toUpperCase() + name.slice(1) : name;
}

/**
 * One plain line on how a payment was cleared or stopped, shown next to
 * "Decided by" wherever a payment appears.
 */
export function decisionNote(actor: Actor, tone: Tone | 'neutral'): string {
  switch (actor) {
    case 'exchange':
      return tone === 'cleared'
        ? 'It needed the approval service to sign, and the exchange checks accepted it.'
        : 'It reached the agent deposit address, and the exchange held it for review.';
    case 'policy':
      return "Shared by the agent's approval service. The money never moved.";
    case 'ledger':
      return 'The XRP Ledger rejected it because the sender holds no agent credential.';
  }
}
