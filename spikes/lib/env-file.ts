import { existsSync, readFileSync, writeFileSync } from 'node:fs';

/**
 * Sets each key in a dotenv file, replacing an existing line for that key or
 * appending a new one. Other lines are kept as they are.
 */
export function upsertEnvFile(path: string, updates: Record<string, string>): void {
  const lines = existsSync(path) ? readFileSync(path, 'utf8').split(/\r?\n/) : [];
  const pending = new Map(Object.entries(updates));

  const updated = lines.map((line) => {
    const key = line.split('=', 1)[0]?.trim();
    const value = key === undefined ? undefined : pending.get(key);
    if (key === undefined || value === undefined) return line;
    pending.delete(key);
    return `${key}=${value}`;
  });

  while (updated.length > 0 && updated.at(-1) === '') updated.pop();
  for (const [key, value] of pending) updated.push(`${key}=${value}`);

  writeFileSync(path, `${updated.join('\n')}\n`, { encoding: 'utf8', mode: 0o600 });
}
