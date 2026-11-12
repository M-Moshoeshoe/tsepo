import { describe, expect, it } from 'vitest';
import { PolicyReason } from '../domain/reasons.ts';
import { outcomeNote, readNote } from './assistant.ts';

const CONTRACTION = /\b\w+n't\b|\b(it's|that's|you're|we're|let's)\b/i;
const intent = (payee: string, amount: string, reference: string) => ({ payee, amount, purpose: 'Work', reference });

describe("Thuso's notes", () => {
  it('reads one payment with its amount and payee', () => {
    expect(readNote([intent('Naledi Mokoena', '2', 'INV-1042')])).toBe(
      'I read this instruction and found 1 payment: 2 RLUSD to Naledi Mokoena. I asked the approval service to approve it.',
    );
  });

  it('groups equal payments to one payee', () => {
    const parts = ['A', 'B', 'C'].map((part) => intent('Thabo Nkosi', '2', `INV-2001-${part}`));
    expect(readNote(parts)).toBe(
      'I read this instruction and found 3 payments to Thabo Nkosi, 2 RLUSD each. I asked the approval service to approve each one.',
    );
  });

  it('lists different payments one by one', () => {
    expect(readNote([intent('Naledi Mokoena', '2', 'A'), intent('Thabo Nkosi', '1.5', 'B')])).toContain(
      'found 2 payments: 2 RLUSD to Naledi Mokoena and 1.5 RLUSD to Thabo Nkosi.',
    );
  });

  it('says plainly when an instruction holds no payment', () => {
    expect(readNote([])).toBe('I read this instruction and found no payments in it, so I paid nothing.');
  });

  it('never states a payee or amount that is not in the record', () => {
    const note = readNote([intent('Naledi Mokoena', '2', 'INV-1042')]);
    const names = note.match(/to ([A-Z][a-z]+ [A-Z][a-z]+)/g) ?? [];
    expect(names).toEqual(['to Naledi Mokoena']);
    expect(note.match(/\d+(\.\d+)? RLUSD/g)).toEqual(['2 RLUSD']);
  });

  it('relays a refusal with the plain reason and says it cannot change the rules', () => {
    const note = outcomeNote({ status: 'not-approved', reasons: [PolicyReason.OverDailyLimit], intent: intent('Thabo Nkosi', '2', 'INV-2001-C') });
    expect(note).toBe(
      'The approval service did not approve INV-2001-C: the payment would go over the daily limit. I cannot change that; only your business can change the spending rules.',
    );
  });

  it('says it can no longer pay after its credential is gone', () => {
    const note = outcomeNote({ status: 'not-approved', reasons: [PolicyReason.CredentialMissing], intent: intent('Naledi Mokoena', '2', 'INV-1043') });
    expect(note).toContain('I can no longer pay anyone.');
  });

  it('says nothing about a payment still in progress, and never claims a decision of its own', () => {
    expect(outcomeNote({ status: 'in-progress', reasons: [], intent: intent('A B', '1', 'R') })).toBeUndefined();
    const notes = [
      outcomeNote({ status: 'paid', reasons: [], intent: intent('A B', '1', 'R') }),
      outcomeNote({ status: 'failed', reasons: ['tecPATH_PARTIAL'], intent: intent('A B', '1', 'R') }),
      outcomeNote({ status: 'not-approved', reasons: [], intent: intent('A B', '1', 'R') }),
    ];
    for (const note of notes) {
      expect(note).toBeDefined();
      expect(note).not.toMatch(/\bI (approved|refused|decided|allowed)\b/);
      expect(note).not.toMatch(CONTRACTION);
      expect(note).not.toMatch(/[–—]/);
    }
  });
});
