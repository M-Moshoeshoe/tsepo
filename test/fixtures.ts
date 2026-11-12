import { Wallet } from 'xrpl';
import type { Directive9Package } from '../src/domain/directive9.ts';
import { fingerprintToInvoiceId, mandateFingerprint } from '../src/domain/fingerprint.ts';
import type { Mandate } from '../src/domain/mandate.ts';
import { RLUSD } from '../src/ledger/testnet.ts';

/** Fresh keys for every test run. No seed is ever written into the repository. */
export function makeParties(): Record<'business' | 'agent' | 'lane' | 'contractor' | 'issuer' | 'stranger', Wallet> {
  return {
    business: Wallet.generate(),
    agent: Wallet.generate(),
    lane: Wallet.generate(),
    contractor: Wallet.generate(),
    issuer: Wallet.generate(),
    stranger: Wallet.generate(),
  };
}

export type Parties = ReturnType<typeof makeParties>;

export function makeMandate(parties: Parties, overrides: Partial<Mandate> = {}): Mandate {
  return {
    version: 2,
    principal: parties.business.address,
    agent: parties.agent.address,
    approvedRecipients: [
      { name: 'Naledi Mokoena', address: parties.lane.address, destinationTag: 1001 },
      { name: 'Contractor', address: parties.contractor.address },
    ],
    currency: 'RLUSD',
    perPaymentLimit: '3',
    dailyLimit: '5',
    expiresAt: '2099-12-31T23:59:59Z',
    ...overrides,
  };
}

export const SAMPLE_INVOICE_ID = fingerprintToInvoiceId(`sha256:${'ab'.repeat(32)}`);

/** An autofilled, unsigned RLUSD payment as the agent sends it to the policy service. */
export function makePayment(parties: Parties, overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    TransactionType: 'Payment',
    Account: parties.agent.address,
    Destination: parties.lane.address,
    DestinationTag: 1001,
    Amount: { currency: RLUSD.currency, issuer: RLUSD.issuer, value: '2' },
    InvoiceID: SAMPLE_INVOICE_ID,
    CredentialIDs: ['C'.repeat(64)],
    SourceTag: 20260530,
    Fee: '36',
    Sequence: 100,
    LastLedgerSequence: 200,
    SigningPubKey: '',
    ...overrides,
  };
}

export function makePackage(parties: Parties, mandate: Mandate, overrides: Partial<Directive9Package> = {}): Directive9Package {
  return {
    version: 1,
    reference: 'TSP-INV-1042',
    createdAt: '2026-11-12T10:00:00.000Z',
    originator: {
      registeredName: 'Lesedi Design Studio (Pty) Ltd',
      registrationNumber: '2021/482913/07',
      address: { street: '12 Maluti Road', city: 'Bloemfontein', postalCode: '9301', country: 'ZA' },
      ledgerAddress: parties.agent.address,
    },
    beneficiary: { name: 'Naledi Mokoena', ledgerAddress: parties.lane.address, destinationTag: 1001 },
    transfer: { amount: '2', currency: 'RLUSD', purpose: 'Logo design, October' },
    agent: {
      ledgerAddress: parties.agent.address,
      credentialIssuer: parties.issuer.address,
      credentialType: 'AGENT_MANDATE',
      mandate,
      mandateFingerprint: mandateFingerprint(mandate),
    },
    ...overrides,
  };
}
