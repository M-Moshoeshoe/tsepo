import { z } from 'zod';
import { ACCESS_CODE_HEADER } from '../src/demo/events.ts';

const ErrorBodySchema = z.object({ error: z.string() });

/** Sends a change that needs the access code, and returns undefined when it was accepted or one plain sentence when it was not. */
export async function postWithCode(path: string, body: unknown, accessCode: string): Promise<string | undefined> {
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', [ACCESS_CODE_HEADER]: accessCode },
      body: JSON.stringify(body),
    });
    if (response.ok) return undefined;
    const parsed = ErrorBodySchema.safeParse(await response.json().catch(() => undefined));
    return parsed.success ? parsed.data.error : 'The change could not be saved. Try again in a minute.';
  } catch {
    return 'The server could not be reached. Try again in a minute.';
  }
}
