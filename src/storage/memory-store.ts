import type { DocumentStore } from './store.ts';

/** An in-memory store for tests. Values are copied in and out, as a real store would. */
export function createMemoryStore(): DocumentStore {
  const collections = new Map<string, Map<string, string>>();
  const logs = new Map<string, string[]>();
  const records = (name: string): Map<string, string> => {
    const existing = collections.get(name);
    if (existing !== undefined) return existing;
    const created = new Map<string, string>();
    collections.set(name, created);
    return created;
  };

  return {
    get(name, key) {
      const text = records(name).get(key);
      return Promise.resolve(text === undefined ? undefined : (JSON.parse(text) as unknown));
    },
    put(name, key, value) {
      records(name).set(key, JSON.stringify(value));
      return Promise.resolve();
    },
    list(name) {
      return Promise.resolve([...records(name).values()].map((text): unknown => JSON.parse(text)));
    },
    clear(name) {
      records(name).clear();
      return Promise.resolve();
    },
    append(name, entry) {
      logs.set(name, [...(logs.get(name) ?? []), JSON.stringify(entry)]);
      return Promise.resolve();
    },
    readLog(name) {
      return Promise.resolve((logs.get(name) ?? []).map((text): unknown => JSON.parse(text)));
    },
  };
}
