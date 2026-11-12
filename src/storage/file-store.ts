import { appendFile, mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import type { DocumentStore } from './store.ts';

const NAME_PATTERN = /^[a-z][a-z0-9-]*$/;
const RecordsSchema = z.record(z.string(), z.unknown());

function checkName(name: string): string {
  if (!NAME_PATTERN.test(name)) throw new Error(`Invalid storage name: ${name}`);
  return name;
}

async function readIfExists(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, 'utf8');
  } catch (error: unknown) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return undefined;
    throw error;
  }
}

/**
 * Keeps each collection in one JSON file and each log in a JSON Lines file
 * under `directory`. Collection writes go to a temporary file first and are
 * then renamed, so a crash never leaves a half-written file. Suitable for a
 * single process.
 */
export function createFileStore(directory: string): DocumentStore {
  const collectionPath = (name: string): string => join(directory, `${checkName(name)}.json`);
  const logPath = (name: string): string => join(directory, `${checkName(name)}.log.jsonl`);

  async function readRecords(name: string): Promise<Record<string, unknown>> {
    const text = await readIfExists(collectionPath(name));
    return text === undefined ? {} : RecordsSchema.parse(JSON.parse(text));
  }

  async function writeRecords(name: string, records: Record<string, unknown>): Promise<void> {
    await mkdir(directory, { recursive: true });
    const path = collectionPath(name);
    const temporary = `${path}.tmp`;
    await writeFile(temporary, `${JSON.stringify(records, null, 2)}\n`, 'utf8');
    await rename(temporary, path);
  }

  return {
    async get(name, key) {
      return (await readRecords(name))[key];
    },
    async put(name, key, value) {
      const records = await readRecords(name);
      records[key] = value;
      await writeRecords(name, records);
    },
    async list(name) {
      return Object.values(await readRecords(name));
    },
    async clear(name) {
      await writeRecords(name, {});
    },
    async append(name, entry) {
      await mkdir(directory, { recursive: true });
      await appendFile(logPath(name), `${JSON.stringify(entry)}\n`, 'utf8');
    },
    async readLog(name) {
      const text = await readIfExists(logPath(name));
      if (text === undefined) return [];
      return text
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line): unknown => JSON.parse(line));
    },
  };
}
