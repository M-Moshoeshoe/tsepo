import { describe, expect, it } from 'vitest';
import { atStage, placeCard, stageHref, storyCaption } from './tour-stage.ts';
import type { TourEvidence } from './tour.ts';

const EVIDENCE: TourEvidence = {
  steps: {
    '1': { links: [{ key: 'paid-at-business', label: 'The payment', href: '/business/payments?range=all&payment=1-TOUR-1042&highlight=decision&tour=1' }] },
    '3': { links: [{ key: 'unknown-rejected', label: 'The rejection' }] },
  },
};

describe('where each tour step is shown', () => {
  it('shows a live step at its first piece of evidence, and the last step on Give an instruction', () => {
    expect(stageHref(1, EVIDENCE)).toBe('/business/payments?range=all&payment=1-TOUR-1042&highlight=decision&tour=1');
    expect(stageHref(5, EVIDENCE)).toBe('/business/instruct?highlight=allowance&tour=5');
  });

  it('stays where the visitor is for the welcome, and for a step that has never run', () => {
    expect(stageHref(0, EVIDENCE)).toBeUndefined();
    expect(stageHref(3, EVIDENCE)).toBeUndefined();
    expect(stageHref(2, undefined)).toBeUndefined();
  });

  it('knows when the address already shows the stage, whatever else it carries', () => {
    expect(atStage('/business/instruct?tour=5&highlight=allowance&x=1', '/business/instruct?highlight=allowance&tour=5')).toBe(true);
    expect(atStage('/business/instruct?tour=4', '/business/instruct?highlight=allowance&tour=5')).toBe(false);
    expect(atStage('/business', '/business/instruct?tour=5')).toBe(false);
  });
});

describe('where the floating card sits', () => {
  const card = { width: 380, height: 300 };
  const desktop = { width: 1280, height: 900 };

  it('docks to the bottom on a phone', () => {
    expect(placeCard({ top: 100, left: 20, width: 200, height: 40 }, card, { width: 390, height: 844 })).toEqual({ kind: 'dock' });
  });

  it('waits in the corner when nothing is lit', () => {
    expect(placeCard(undefined, card, desktop)).toEqual({ kind: 'corner' });
  });

  it('sits to the right of the element when there is room, centred on it', () => {
    expect(placeCard({ top: 400, left: 100, width: 300, height: 100 }, card, desktop)).toEqual({ kind: 'beside', side: 'right', left: 416, top: 300 });
  });

  it('moves to the left, then below, then above, and never leaves the screen', () => {
    expect(placeCard({ top: 400, left: 700, width: 500, height: 100 }, card, desktop)).toMatchObject({ side: 'left', left: 304 });
    const wide = { top: 100, left: 16, width: 1248, height: 80 };
    expect(placeCard(wide, card, desktop)).toMatchObject({ side: 'below', top: 196 });
    expect(placeCard({ ...wide, top: 560 }, card, desktop)).toMatchObject({ side: 'above', top: 244 });
    const nearTop = placeCard({ top: 0, left: 100, width: 200, height: 40 }, card, desktop);
    expect(nearTop).toMatchObject({ side: 'right', top: 16 });
  });

  it('falls back to the corner when the element fills the screen', () => {
    expect(placeCard({ top: 0, left: 0, width: 1280, height: 900 }, card, desktop)).toEqual({ kind: 'corner' });
  });
});

describe('the story captions', () => {
  it('says which step is playing and what it is doing, in plain words', () => {
    expect(storyCaption({ index: 1, phase: 'running' })).toBe('Step 2 of 6: Your agent pays Naledi for a logo. Running live on the XRP Ledger Testnet.');
    expect(storyCaption({ index: 3, phase: 'showing', summary: 'The XRP Ledger rejected its payment.' })).toBe(
      'Step 4 of 6: An unknown agent tries to pay. The XRP Ledger rejected its payment.',
    );
    expect(storyCaption({ index: 2, phase: 'no-run' })).toMatch(/has not run live yet/);
    expect(storyCaption({ index: 5, phase: 'ended' })).toBe('The story is over. Here is what the tour showed.');
  });
});
