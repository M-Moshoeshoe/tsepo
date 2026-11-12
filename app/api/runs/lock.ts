import 'server-only';

/** Only one demo run may touch the ledger at a time, or transaction sequence numbers would clash. */
const state = globalThis as typeof globalThis & { tsepoRunActive?: boolean };

export function acquireRunLock(): boolean {
  if (state.tsepoRunActive === true) return false;
  state.tsepoRunActive = true;
  return true;
}

export function releaseRunLock(): void {
  state.tsepoRunActive = false;
}
