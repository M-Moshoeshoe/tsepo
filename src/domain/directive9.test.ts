import { describe, expect, it } from 'vitest';
import { makeMandate, makePackage, makeParties } from '../../test/fixtures.ts';
import { Directive9PackageSchema, packageFingerprint } from './directive9.ts';
import { fingerprintToInvoiceId } from './fingerprint.ts';

const parties = makeParties();
const mandate = makeMandate(parties);

describe('Directive9PackageSchema', () => {
  it('accepts a complete package', () => {
    expect(Directive9PackageSchema.safeParse(makePackage(parties, mandate)).success).toBe(true);
  });

  it('requires the business registration number', () => {
    const pkg = makePackage(parties, mandate);
    const originator: Record<string, unknown> = { ...pkg.originator };
    delete originator.registrationNumber;
    expect(Directive9PackageSchema.safeParse({ ...pkg, originator }).success).toBe(false);
  });

  it('rejects fields it does not know', () => {
    const pkg = { ...makePackage(parties, mandate), notes: 'extra' };
    expect(Directive9PackageSchema.safeParse(pkg).success).toBe(false);
  });

  it('rejects an invalid ledger address', () => {
    const pkg = makePackage(parties, mandate);
    const beneficiary = { ...pkg.beneficiary, ledgerAddress: 'rNotAnAddress' };
    expect(Directive9PackageSchema.safeParse({ ...pkg, beneficiary }).success).toBe(false);
  });
});

describe('packageFingerprint', () => {
  it('is stable for the same package regardless of key order', () => {
    const pkg = makePackage(parties, mandate);
    const { agent, ...rest } = pkg;
    const reordered = JSON.parse(JSON.stringify({ agent, ...rest })) as typeof pkg;
    expect(packageFingerprint(reordered)).toBe(packageFingerprint(pkg));
  });

  it('changes when the amount changes', () => {
    const pkg = makePackage(parties, mandate);
    const changed = { ...pkg, transfer: { ...pkg.transfer, amount: '2.5' } };
    expect(packageFingerprint(changed)).not.toBe(packageFingerprint(pkg));
  });

  it('converts to a 64 character uppercase InvoiceID', () => {
    const invoiceId = fingerprintToInvoiceId(packageFingerprint(makePackage(parties, mandate)));
    expect(invoiceId).toMatch(/^[0-9A-F]{64}$/);
  });
});

describe('fingerprintToInvoiceId', () => {
  it('rejects anything that is not a sha256 fingerprint', () => {
    expect(() => fingerprintToInvoiceId('md5:abc')).toThrow();
  });
});
