import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** Reads the colour values from the Tšepo theme, so the test checks what ships. */
const css = readFileSync(new URL('../../ui/styles/tsepo-theme.css', import.meta.url), 'utf8');

function color(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-f]{6})`, 'i').exec(css);
  if (match?.[1] === undefined) throw new Error(`--color-${name} is not defined`);
  return match[1];
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16) / 255);
  const [r = 0, g = 0, b = 0] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

const WHITE = '#ffffff';

describe('Tšepo theme', () => {
  it('keeps the exact tokens', () => {
    expect(color('brand-600')).toBe('#0b5563');
    expect(color('brand-700')).toBe('#08404b');
    expect(color('neutral-900')).toBe('#0b1f2e');
    expect(color('neutral-600')).toBe('#4a5a68');
    expect(color('neutral-50')).toBe('#f5f7f7');
    expect(color('neutral-300')).toBe('#d5dcdf');
    expect([color('green-700'), color('green-50')]).toEqual(['#11693a', '#e3f4ea']);
    expect([color('yellow-700'), color('yellow-50')]).toEqual(['#7a4d00', '#fff1d6']);
    expect([color('red-700'), color('red-50')]).toEqual(['#a1251b', '#fde7e4']);
    expect(color('accent')).toBe('#c7841a');
  });

  it.each([
    ['white text on primary buttons', WHITE, 'brand-600'],
    ['white text on hovered primary buttons', WHITE, 'brand-700'],
    ['brand links on white', 'brand-700', WHITE],
    ['brand badges', 'brand-700', 'brand-50'],
    ['ink on the page background', 'neutral-900', 'neutral-50'],
    ['muted text on white', 'neutral-600', WHITE],
    ['muted text on the page background', 'neutral-600', 'neutral-50'],
    ['muted text on the sidebar', 'neutral-600', 'neutral-100'],
    ['placeholder text on white', 'neutral-500', WHITE],
    ['grey badges', 'neutral-700', 'neutral-50'],
    ['cleared badges', 'green-700', 'green-50'],
    ['held badges', 'yellow-700', 'yellow-50'],
    ['refused badges', 'red-700', 'red-50'],
  ])('meets WCAG AA (4.5:1) for %s', (_name, foreground, background) => {
    const fg = foreground.startsWith('#') ? foreground : color(foreground);
    const bg = background.startsWith('#') ? background : color(background);
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the focus ring visible against white (3:1)', () => {
    expect(contrast(color('brand-500'), WHITE)).toBeGreaterThanOrEqual(3);
  });
});
