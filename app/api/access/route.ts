import { refuseWrongCode } from '../runs/guard.ts';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Checks the demo access code without running anything, so the interface only
 * says "Demo unlocked" for a code the server accepts. Wrong codes count
 * against the same limit as on the run endpoint.
 */
export function POST(request: Request): Response {
  return refuseWrongCode(request) ?? new Response(null, { status: 204 });
}
