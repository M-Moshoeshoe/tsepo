import { describe, expect, it } from 'vitest';
import { makeParties, makePayment } from '../../test/fixtures.ts';
import { readUnsignedPayment } from './payment-facts.ts';

const parties = makeParties();

describe('readUnsignedPayment', () => {
  it('reads the facts the rules need', () => {
    const read = readUnsignedPayment(makePayment(parties));
    expect(read.ok).toBe(true);
    if (!read.ok) return;
    expect(read.facts).toMatchObject({
      transactionType: 'Payment',
      account: parties.agent.address,
      destination: parties.lane.address,
      destinationTag: 1001,
      usesUnsupportedFeature: false,
      hasMemos: false,
      feeDrops: 36n,
    });
  });

  it.each([
    ['an existing signature', { TxnSignature: 'AB' }],
    ['existing signers', { Signers: [] }],
    ['a signing key', { SigningPubKey: 'ED00' }],
    ['an unknown field', { SetFlag: 4 }],
    ['a missing sequence', { Sequence: undefined }],
    ['a fee that is not whole drops', { Fee: '1.5' }],
  ])('rejects a payment with %s', (_name, change) => {
    expect(readUnsignedPayment(makePayment(parties, change)).ok).toBe(false);
  });

  it('rejects input that is not an object', () => {
    expect(readUnsignedPayment('{"TransactionType":"Payment"}').ok).toBe(false);
    expect(readUnsignedPayment(null).ok).toBe(false);
  });
});
