import { MandateSchema, type Mandate } from '../domain/mandate.ts';
import type { Wallets } from './wallets.ts';

/** A fictional business used in every demo. None of these details refer to a real company. */
export const DEMO_BUSINESS = {
  registeredName: 'Lesedi Design Studio (Pty) Ltd',
  registrationNumber: '2021/482913/07',
  address: { street: '12 Maluti Road', city: 'Bloemfontein', postalCode: '9301', country: 'ZA' },
} as const;

export type BusinessIdentity = typeof DEMO_BUSINESS;

/** The demo limits: 3 RLUSD per payment and 5 RLUSD per day. */
export const DEMO_LIMITS = { perPaymentLimit: '3', dailyLimit: '5' } as const;

/** Fixed so that the mandate fingerprint stays the same across runs. */
const DEMO_MANDATE_EXPIRY = '2026-12-31T23:59:59Z';

export function demoMandate(wallets: Wallets): Mandate {
  return MandateSchema.parse({
    version: 1,
    principal: wallets.business.address,
    agent: wallets.agent.address,
    approvedRecipients: [wallets.exchange.address, wallets.contractor.address],
    currency: 'RLUSD',
    ...DEMO_LIMITS,
    expiresAt: DEMO_MANDATE_EXPIRY,
  });
}

/** Contractors paid through their accounts at the exchange, each identified by a destination tag. */
export const DEMO_PAYEES = [
  { name: 'Naledi Mokoena', destinationTag: 1001 },
  { name: 'Thabo Nkosi', destinationTag: 1002 },
] as const;
