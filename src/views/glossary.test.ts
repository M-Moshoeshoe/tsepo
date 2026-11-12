import { describe, expect, it } from 'vitest';
import { DESK_FILTERS, emptyDeskText } from './desk.ts';
import { GLOSSARY, isGlossaryTerm } from './glossary.ts';

const CONTRACTION = /\b\w+n't\b|\b(it's|that's|you're|we're|let's)\b/i;

describe('glossary', () => {
  it('explains every term in one plain line', () => {
    for (const line of Object.values(GLOSSARY)) {
      expect(line).not.toContain('\n');
      expect(line).not.toMatch(CONTRACTION);
      expect(line).not.toMatch(/[\u2013\u2014]/);
      expect(line.length).toBeLessThan(140);
    }
  });

  it('recognises only known terms', () => {
    expect(isGlossaryTerm('tecNO_PERMISSION')).toBe(true);
    expect(isGlossaryTerm('tesSUCCESS')).toBe(false);
  });
});

describe('empty desk text', () => {
  it('tells the person what to do next for every filter', () => {
    for (const filter of DESK_FILTERS) {
      const text = emptyDeskText(filter.id);
      expect(text.title.length).toBeGreaterThan(0);
      expect(text.next.length).toBeGreaterThan(0);
    }
    expect(emptyDeskText('all')).toEqual({ title: 'No payments yet.', next: 'Run scenario 2 to see a cleared payment.' });
  });
});
