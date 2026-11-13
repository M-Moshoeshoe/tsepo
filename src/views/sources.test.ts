import { describe, expect, it } from 'vitest';
import { feePerSideCents, formatRand } from '../domain/pricing.ts';
import { FAQ } from './faq.ts';
import { RECEIVING_PLATFORM_LINE } from './navigation.ts';
import { ABOUT_NOTES, LANDING_NOTES, MARKET_NOTES, noteNumber, SOURCES } from './sources.ts';

describe('cited sources', () => {
  it('gives every source a title, publisher, date and HTTPS link', () => {
    for (const source of Object.values(SOURCES)) {
      expect(source.href).toMatch(/^https:\/\//);
      for (const field of [source.title, source.publisher, source.date]) expect(field.length).toBeGreaterThan(0);
    }
  });

  it('lists every source on the landing page, once, so every footnote has somewhere to go', () => {
    expect(new Set(LANDING_NOTES).size).toBe(LANDING_NOTES.length);
    expect(new Set(LANDING_NOTES)).toEqual(new Set(Object.values(SOURCES)));
    expect(noteNumber(LANDING_NOTES, SOURCES.freysa)).toBe(1);
  });

  it('refuses a footnote to a source the page does not list', () => {
    expect(() => noteNumber(ABOUT_NOTES, SOURCES.freysa)).toThrow(/does not list/);
    expect(noteNumber(MARKET_NOTES, SOURCES.keyrock)).toBe(1);
  });

  it('cites the outside figure in the FAQ', () => {
    expect(FAQ.find((entry) => entry.question === 'Why crypto?')?.source).toBe(SOURCES.keyrock);
  });

  it('describes the receiving platform in plain words, with VALR and Luno as examples only', () => {
    expect(RECEIVING_PLATFORM_LINE).toBe('The crypto platform where the recipient receives the money, such as VALR or Luno.');
    expect(FAQ.some((entry) => entry.question === 'What is a receiving platform?' && entry.answer.join(' ').includes('no partnership'))).toBe(true);
  });

  it('quotes the same prices in the FAQ as the pricing rules work out', () => {
    const cost = FAQ.find((entry) => entry.question === 'What will it cost?')?.answer.join(' ') ?? '';
    expect(cost).toContain(`a R50 payment costs each side ${formatRand(feePerSideCents(5_000))}`);
    expect(cost).toContain(`a R2,000 payment costs each side ${formatRand(feePerSideCents(200_000))}`);
    expect(cost).toContain(`a R50,000 payment costs each side ${formatRand(feePerSideCents(5_000_000))}`);
  });
});
