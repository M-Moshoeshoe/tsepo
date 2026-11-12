import { describe, expect, it } from 'vitest';
import type { Client } from 'xrpl';
import { getIncomingPayments } from './reads.ts';

const LANE = 'rw5QcoNLQM9Zn1GN79GfB6DM5qsX4RxfDZ';

/** A stand-in client: the newest validated ledger is 100, and account_tx returns no transactions. */
function fakeClient(): { client: Client; requests: () => number } {
  let count = 0;
  const client = {
    getLedgerIndex: () => Promise.resolve(100),
    request: () => {
      count += 1;
      return Promise.resolve({ result: { transactions: [] } });
    },
  } as unknown as Client;
  return { client, requests: () => count };
}

describe('incoming payments', () => {
  it('asks nothing when no ledger after the cursor is validated yet, so a second sync after a run is not an error', async () => {
    const { client, requests } = fakeClient();
    expect(await getIncomingPayments(client, LANE, 100)).toEqual([]);
    expect(requests()).toBe(0);
  });

  it('reads the ledgers after the cursor once a newer one is validated', async () => {
    const { client, requests } = fakeClient();
    expect(await getIncomingPayments(client, LANE, 99)).toEqual([]);
    expect(requests()).toBe(1);
  });
});
