import type { DemoEvent } from '../demo/events.ts';
import { printLine, printStep, txLink } from './output.ts';

/** Prints demo progress to the terminal, with explorer links for transactions. */
export function consoleReport(event: DemoEvent): void {
  switch (event.type) {
    case 'step':
      printStep(event.text);
      break;
    case 'line':
      printLine(event.hash === undefined ? event.text : `${event.text} ${txLink(event.hash)}`);
      break;
    case 'done':
      printStep(event.text);
      break;
    case 'failed':
      printStep(`Stopped: ${event.text}`);
      break;
  }
}
