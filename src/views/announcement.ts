/**
 * What a screen reader hears when a run ends: "Reset demo finished." or
 * "Scenario 3: Split payments stopped. <reason>". Nothing while it runs, because
 * the steps already stream into their own live list.
 */
export function runEndAnnouncement(label: string, status: 'running' | 'done' | 'failed', reason?: string): string {
  if (status === 'running') return '';
  if (status === 'done') return `${label} finished.`;
  return reason === undefined ? `${label} stopped.` : `${label} stopped. ${reason}`;
}
