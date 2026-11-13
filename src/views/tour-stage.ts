import { LAST_STEP, TOUR_STEPS, tryItHref, type TourEvidence } from './tour.ts';

/**
 * Where each tour step is shown, and where its floating card sits. Pure, so
 * the walkthrough and "Play the story" are tested without a browser.
 */

/** How long "Play the story" stays on a result before it moves on, when motion is allowed. */
export const STORY_DWELL_MS = 7000;
/** How long the welcome stays before the story starts its first step. */
export const STORY_WELCOME_MS = 3500;

/**
 * The page a step is shown on: its first piece of evidence, with the record
 * open and named for the highlight. Undefined for the welcome, and for a live
 * step that has never run, which stays on the page the visitor is on.
 */
export function stageHref(index: number, evidence: TourEvidence | undefined): string | undefined {
  const step = TOUR_STEPS[index];
  if (step === undefined || step.kind === 'welcome') return undefined;
  if (step.kind === 'try') return tryItHref(LAST_STEP);
  return evidence?.steps[String(index)]?.links.find((link) => link.href !== undefined)?.href;
}

/** True when the address already shows this stage, so the tour does not navigate again. */
export function atStage(current: string, stage: string): boolean {
  const [currentPath, currentQuery = ''] = current.split('?');
  const [stagePath, stageQuery = ''] = stage.split('?');
  if (currentPath !== stagePath) return false;
  const have = new URLSearchParams(currentQuery);
  return [...new URLSearchParams(stageQuery)].every(([key, value]) => have.get(key) === value);
}

export interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface Size {
  width: number;
  height: number;
}

/** Below this width the card docks to the bottom of the screen. */
export const PHONE_WIDTH = 640;
const GAP = 16;
const MARGIN = 16;

export type Placement = { kind: 'dock' } | { kind: 'corner' } | { kind: 'beside'; top: number; left: number; side: 'right' | 'left' | 'below' | 'above' };

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), Math.max(low, high));
}

/**
 * Where the floating card goes: on a phone it docks to the bottom; with no
 * lit element it waits in the corner; otherwise beside the element, on the
 * first side with room (right, left, below, above), always inside the screen.
 */
export function placeCard(target: Box | undefined, card: Size, viewport: Size): Placement {
  if (viewport.width < PHONE_WIDTH) return { kind: 'dock' };
  if (target === undefined) return { kind: 'corner' };
  const middleTop = clamp(target.top + target.height / 2 - card.height / 2, MARGIN, viewport.height - card.height - MARGIN);
  const middleLeft = clamp(target.left + target.width / 2 - card.width / 2, MARGIN, viewport.width - card.width - MARGIN);

  const right = target.left + target.width + GAP;
  if (right + card.width <= viewport.width - MARGIN) return { kind: 'beside', side: 'right', left: right, top: middleTop };
  const left = target.left - GAP - card.width;
  if (left >= MARGIN) return { kind: 'beside', side: 'left', left, top: middleTop };
  const below = target.top + target.height + GAP;
  if (below + card.height <= viewport.height - MARGIN) return { kind: 'beside', side: 'below', top: below, left: middleLeft };
  const above = target.top - GAP - card.height;
  if (above >= MARGIN) return { kind: 'beside', side: 'above', top: above, left: middleLeft };
  return { kind: 'corner' };
}

/** What "Play the story" says while it shows a step, as real text. */
export function storyCaption(input: {
  index: number;
  phase: 'running' | 'waiting' | 'showing' | 'paused' | 'ended' | 'no-run';
  summary?: string;
}): string {
  const step = TOUR_STEPS[input.index];
  const where = step === undefined ? '' : `Step ${String(input.index + 1)} of ${String(TOUR_STEPS.length)}: ${step.title}.`;
  switch (input.phase) {
    case 'running':
      return `${where} Running live on the XRP Ledger Testnet.`;
    case 'waiting':
      return `${where} Another visitor is running a step; the story continues when the ledger is free.`;
    case 'showing':
      return input.summary === undefined ? where : `${where} ${input.summary}`;
    case 'no-run':
      return `${where} This step has not run live yet, so there is nothing to show.`;
    case 'paused':
      return `${where} Paused.`;
    case 'ended':
      return 'The story is over. Here is what the tour showed.';
  }
}
