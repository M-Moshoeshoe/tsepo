import { describe, expect, it } from 'vitest';
import { FAQ } from './faq.ts';
import { RECEIVING_PLATFORM_LINE } from './navigation.ts';
import { SOURCES } from './sources.ts';

describe('cited sources', () => {
  it('links every source over HTTPS, with a label', () => {
    for (const source of Object.values(SOURCES)) {
      expect(source.href).toMatch(/^https:\/\//);
      expect(source.label.length).toBeGreaterThan(0);
    }
  });

  it('cites the outside figure in the FAQ', () => {
    const whyCrypto = FAQ.find((entry) => entry.question === 'Why crypto?');
    expect(whyCrypto?.source).toBe(SOURCES.keyrock);
  });

  it('describes the receiving platform in plain words, with VALR and Luno as examples only', () => {
    expect(RECEIVING_PLATFORM_LINE).toBe('The crypto platform where the recipient receives the money, such as VALR or Luno.');
    expect(FAQ.some((entry) => entry.question === 'What is a receiving platform?' && entry.answer.join(' ').includes('no partnership'))).toBe(true);
  });
});
