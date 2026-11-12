import { MandateSchema, type Mandate } from '../domain/mandate.ts';
import type { Wallets } from './wallets.ts';

/** A fictional business used in every demo. None of these details refer to a real company. */
export const DEMO_BUSINESS = {
  registeredName: 'Lesedi Design Studio (Pty) Ltd',
  registrationNumber: '2021/482913/07',
  address: { street: '12 Maluti Road', city: 'Bloemfontein', postalCode: '9301', country: 'ZA' },
} as const;

export type BusinessIdentity = typeof DEMO_BUSINESS;

/** Contractors paid through their accounts at the exchange, each identified by a destination tag. */
export const DEMO_PAYEES = [
  { name: 'Naledi Mokoena', destinationTag: 1001 },
  { name: 'Thabo Nkosi', destinationTag: 1002 },
] as const;

/** The demo limits: 3 RLUSD per payment and 5 RLUSD per day. */
export const DEMO_LIMITS = { perPaymentLimit: '3', dailyLimit: '5' } as const;

/** 23:59:59 SAST on 31 December 2026. Fixed so that the mandate fingerprint stays the same across runs. */
const DEMO_MANDATE_EXPIRY = '2026-12-31T21:59:59Z';

export function demoMandate(wallets: Wallets): Mandate {
  return MandateSchema.parse({
    version: 2,
    principal: wallets.business.address,
    agent: wallets.agent.address,
    // Every recipient the demo pays, each at their own destination tag on the exchange agent lane.
    approvedRecipients: DEMO_PAYEES.map((payee) => ({
      name: payee.name,
      address: wallets.exchange.address,
      destinationTag: payee.destinationTag,
    })),
    currency: 'RLUSD',
    ...DEMO_LIMITS,
    expiresAt: DEMO_MANDATE_EXPIRY,
  });
}
