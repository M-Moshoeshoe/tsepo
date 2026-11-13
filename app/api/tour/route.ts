import { loadTourEvidence } from '../../_data/tour.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The guided tour's evidence: for each live step, its latest run and where its
 * proof is. Read-only; it never runs anything and needs no access code.
 */
export async function GET(): Promise<Response> {
  try {
    return Response.json(await loadTourEvidence(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error: unknown) {
    console.error('[tour] could not read the evidence', error instanceof Error ? error.name : 'unknown error');
    return Response.json({ error: 'The tour could not read the ledger or the records. Try again in a minute.' }, { status: 503 });
  }
}
