import { MandateSchema, type Mandate } from '../../src/mandate/mandate.ts';
import type { Wallets } from './wallets.ts';

/**
 * The sample mandate used by every spike. The expiry is fixed so that the
 * fingerprint stays the same across runs.
 */
export function sampleMandate(wallets: Wallets): Mandate {
  return MandateSchema.parse({
    version: 1,
    principal: wallets.business.address,
    agent: wallets.agent.address,
    approvedRecipients: [wallets.contractor.address, wallets.exchange.address],
    currency: 'RLUSD',
    perPaymentLimit: '5',
    dailyLimit: '20',
    expiresAt: '2026-12-31T23:59:59Z',
  });
}
