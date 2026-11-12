import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createFileStore } from './file-store.ts';
import { createMemoryStore } from './memory-store.ts';
import { appendOnlyLog, collection, type DocumentStore } from './store.ts';

const ItemSchema = z.object({ name: z.string(), count: z.number() });

let directory: string;

beforeEach(async () => {
  directory = await mkdtemp(join(tmpdir(), 'tsepo-store-'));
});

afterEach(async () => {
  await rm(directory, { recursive: true, force: true });
});

describe.each([
  ['file store', (): DocumentStore => createFileStore(directory)],
  ['memory store', (): DocumentStore => createMemoryStore()],
])('%s', (_name, makeStore) => {
  it('puts, gets, lists and clears records', async () => {
    const items = collection(makeStore(), 'items', ItemSchema);
    await items.put('a', { name: 'a', count: 1 });
    await items.put('b', { name: 'b', count: 2 });
    await items.put('a', { name: 'a', count: 3 });

    expect(await items.get('a')).toEqual({ name: 'a', count: 3 });
    expect(await items.get('missing')).toBeUndefined();
    expect(await items.list()).toHaveLength(2);

    await items.clear();
    expect(await items.list()).toEqual([]);
  });

  it('appends to a log in order and keeps every entry', async () => {
    const log = appendOnlyLog(makeStore(), 'events', ItemSchema);
    await log.append({ name: 'first', count: 1 });
    await log.append({ name: 'second', count: 2 });
    expect((await log.readAll()).map((entry) => entry.name)).toEqual(['first', 'second']);
  });

  it('refuses to store a record that fails validation', async () => {
    const items = collection(makeStore(), 'items', ItemSchema);
    await expect(items.put('bad', { name: 'bad', count: 'many' } as never)).rejects.toThrow();
  });
});

describe('file store', () => {
  it('keeps data across store instances', async () => {
    await collection(createFileStore(directory), 'items', ItemSchema).put('a', { name: 'a', count: 1 });
    expect(await collection(createFileStore(directory), 'items', ItemSchema).get('a')).toEqual({ name: 'a', count: 1 });
  });

  it('rejects names that could escape the directory', async () => {
    await expect(createFileStore(directory).get('../secrets', 'x')).rejects.toThrow();
  });
});
