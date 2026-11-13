import 'server-only';
import { tourEvidence, type TourEvidence } from '../../src/views/tour.ts';
import { readBusinessRecords } from './business.ts';
import { collectDeskEntries } from './desk-entries.ts';
import { withDemo } from './ledger.ts';

/** Every live step's latest run and evidence links, read from the records and the ledger. */
export async function loadTourEvidence(): Promise<TourEvidence> {
  return withDemo(async (ctx) => {
    const [business, desk, lastRuns] = await Promise.all([readBusinessRecords(ctx), collectDeskEntries(ctx), ctx.demo.lastRuns()]);
    return tourEvidence({
      instructions: business.instructions,
      payments: business.payments,
      desk: desk.entries.map((entry) => ({ id: entry.id, kind: entry.kind, at: entry.at, invoiceId: entry.invoiceId })),
      lastRuns,
    });
  });
}
