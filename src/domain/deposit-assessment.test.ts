import { beforeEach, describe, expect, it } from 'vitest';
import { makeMandate, makePackage, makeParties, SAMPLE_INVOICE_ID, type Parties } from '../../test/fixtures.ts';
import { RLUSD } from '../ledger/testnet.ts';
import { assessDeposit, type DepositContext } from './deposit-assessment.ts';
import { mandateFingerprint } from './fingerprint.ts';
import { DepositReason } from './reasons.ts';

let parties: Parties;

beforeEach(() => {
  parties = makeParties();
});

function context(change: (base: DepositContext) => DepositContext = (base) => base): DepositContext {
  const mandate = makeMandate(parties);
  const base: DepositContext = {
    payment: {
      hash: 'H'.repeat(64),
      ledgerIndex: 1000,
      sender: parties.agent.address,
      destinationTag: 1001,
      invoiceId: SAMPLE_INVOICE_ID,
      delivered: { currency: RLUSD.currency, issuer: RLUSD.issuer, value: '2' },
      credentialIds: ['C'.repeat(64)],
    },
    received: { package: makePackage(parties, mandate), receivedLedgerIndex: 998 },
    credential: {
      issuer: parties.issuer.address,
      subject: parties.agent.address,
      credentialType: 'AGENT_MANDATE',
      uri: mandateFingerprint(mandate),
    },
    laneAddress: parties.lane.address,
    issuerAddress: parties.issuer.address,
  };
  return change(base);
}

function held(...reasons: DepositReason[]): { status: 'Held'; reasons: DepositReason[] } {
  return { status: 'Held', reasons };
}

describe('assessDeposit', () => {
  it('clears a payment whose package arrived first and matches in every detail', () => {
    expect(assessDeposit(context())).toEqual({ status: 'Cleared' });
  });

  it('holds a payment with no package', () => {
    expect(assessDeposit(context((c) => ({ ...c, received: undefined })))).toEqual(held(DepositReason.PackageMissing));
  });

  it('holds a payment whose package arrived in the same ledger or later', () => {
    const late = context((c) => ({ ...c, received: c.received && { ...c.received, receivedLedgerIndex: 1000 } }));
    expect(assessDeposit(late)).toEqual(held(DepositReason.PackageAfterPayment));
  });

  it('holds a payment from an account other than the package originator', () => {
    const other = context((c) => ({ ...c, payment: { ...c.payment, sender: parties.stranger.address } }));
    expect(assessDeposit(other)).toEqual(held(DepositReason.SenderMismatch, DepositReason.CredentialMismatch));
  });

  it('holds a payment for another beneficiary tag', () => {
    const other = context((c) => ({ ...c, payment: { ...c.payment, destinationTag: 9 } }));
    expect(assessDeposit(other)).toEqual(held(DepositReason.BeneficiaryMismatch));
  });

  it('holds a payment that delivered a different amount or token', () => {
    const more = context((c) => ({
      ...c,
      payment: { ...c.payment, delivered: { currency: RLUSD.currency, issuer: RLUSD.issuer, value: '2.5' } },
    }));
    expect(assessDeposit(more)).toEqual(held(DepositReason.AmountMismatch));
    const fake = context((c) => ({
      ...c,
      payment: { ...c.payment, delivered: { currency: RLUSD.currency, issuer: parties.stranger.address, value: '2' } },
    }));
    expect(assessDeposit(fake)).toEqual(held(DepositReason.AmountMismatch));
  });

  it('holds a payment that presented no credential, or one no longer on the ledger', () => {
    const none = context((c) => ({ ...c, payment: { ...c.payment, credentialIds: [] } }));
    expect(assessDeposit(none)).toEqual(held(DepositReason.CredentialNotPresented));
    expect(assessDeposit(context((c) => ({ ...c, credential: undefined })))).toEqual(
      held(DepositReason.CredentialNotFound),
    );
  });

  it('holds a payment whose credential proves a different mandate', () => {
    const other = context((c) => ({ ...c, credential: c.credential && { ...c.credential, uri: `sha256:${'0'.repeat(64)}` } }));
    expect(assessDeposit(other)).toEqual(held(DepositReason.CredentialMismatch));
  });

  it('holds a package whose mandate does not match its own fingerprint', () => {
    const forged = context((c) => {
      if (c.received === undefined) return c;
      const pkg = c.received.package;
      const agent = { ...pkg.agent, mandate: { ...pkg.agent.mandate, dailyLimit: '500' } };
      return { ...c, received: { ...c.received, package: { ...pkg, agent } } };
    });
    expect(assessDeposit(forged)).toEqual(held(DepositReason.MandateFingerprintMismatch));
  });
});
