import { parseReportRange, recordsInRange, reportFileName, toCsv } from '../../../../../src/views/reports.ts';
import { loadDecisionRecords } from '../../../../_data/reports.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Downloads the decision records for a date range as CSV or JSON, for the
 * exchange's own goAML reporting. The range is checked before anything is
 * read. Tšepo files nothing with the FIC.
 */
export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const format = params.get('format');
  if (format !== 'csv' && format !== 'json') return Response.json({ error: 'Choose CSV or JSON.' }, { status: 400 });
  const range = parseReportRange(params.get('from') ?? undefined, params.get('to') ?? undefined, new Date());
  if ('error' in range) return Response.json({ error: range.error }, { status: 400 });
  try {
    const records = recordsInRange(await loadDecisionRecords(), range);
    const body = format === 'csv' ? toCsv(records) : `${JSON.stringify({ range, records }, null, 2)}\n`;
    return new Response(body, {
      headers: {
        'Content-Type': format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="${reportFileName(range, format)}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error: unknown) {
    console.error('[reports] could not build the report', error instanceof Error ? error.message : 'unknown error');
    return Response.json({ error: 'The records could not be read from the ledger or the service records. Try again.' }, { status: 503 });
  }
}
