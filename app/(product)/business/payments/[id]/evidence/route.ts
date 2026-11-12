import { evidenceFileName } from '../../../../../../src/views/evidence.ts';
import { loadPaymentEvidence } from '../../../../../_data/business.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ID = /^\d{1,15}-[A-Za-z0-9-]{1,32}$/;

/**
 * Downloads the evidence for one payment as JSON. The id is checked before
 * anything is read; the file is validated against its schema before it leaves.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await params;
  if (!ID.test(id)) return Response.json({ error: 'That is not a payment reference.' }, { status: 400 });
  try {
    const evidence = await loadPaymentEvidence(id);
    if (evidence === undefined) return Response.json({ error: 'No payment has that reference.' }, { status: 404 });
    const name = evidenceFileName(evidence.payment.reference, evidence.instruction.receivedAt);
    return new Response(`${JSON.stringify(evidence, null, 2)}\n`, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${name}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    console.error('[evidence] could not build the evidence file', error);
    return Response.json({ error: 'The evidence could not be read from the ledger or the records. Try again.' }, { status: 503 });
  }
}
