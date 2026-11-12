import type { z } from 'zod';

/**
 * The storage every service depends on. The local file adapter implements
 * it now; a hosted database can implement it at deploy time without any
 * service changing.
 */
export interface DocumentStore {
  get(collection: string, key: string): Promise<unknown>;
  put(collection: string, key: string, value: unknown): Promise<void>;
  list(collection: string): Promise<unknown[]>;
  clear(collection: string): Promise<void>;
  /** Adds an entry to an append-only log. Entries are never changed or removed. */
  append(log: string, entry: unknown): Promise<void>;
  readLog(log: string): Promise<unknown[]>;
}

/** A named set of records, validated with Zod every time it is read or written. */
export interface Collection<T> {
  get(key: string): Promise<T | undefined>;
  put(key: string, value: T): Promise<void>;
  list(): Promise<T[]>;
  clear(): Promise<void>;
}

export function collection<S extends z.ZodType>(store: DocumentStore, name: string, schema: S): Collection<z.infer<S>> {
  return {
    async get(key) {
      const value = await store.get(name, key);
      return value === undefined ? undefined : schema.parse(value);
    },
    async put(key, value) {
      await store.put(name, key, schema.parse(value));
    },
    async list() {
      return (await store.list(name)).map((value) => schema.parse(value));
    },
    async clear() {
      await store.clear(name);
    },
  };
}

export interface AppendOnlyLog<T> {
  append(entry: T): Promise<void>;
  readAll(): Promise<T[]>;
}

export function appendOnlyLog<S extends z.ZodType>(store: DocumentStore, name: string, schema: S): AppendOnlyLog<z.infer<S>> {
  return {
    async append(entry) {
      await store.append(name, schema.parse(entry));
    },
    async readAll() {
      return (await store.readLog(name)).map((entry) => schema.parse(entry));
    },
  };
}
