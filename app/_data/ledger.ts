import 'server-only';
import { Client } from 'xrpl';
import { createDemoContext, type DemoContext } from '../../src/demo/context.ts';
import { TESTNET_URL } from '../../src/ledger/testnet.ts';

/** Opens a Testnet connection and the demo services for one page load, then closes it. */
export async function withDemo<T>(read: (ctx: DemoContext) => Promise<T>): Promise<T> {
  const client = new Client(TESTNET_URL);
  try {
    await client.connect();
    return await read(createDemoContext(client, () => undefined));
  } finally {
    if (client.isConnected()) await client.disconnect();
  }
}
