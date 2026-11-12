import { Client } from 'xrpl';
import { TESTNET_URL } from '../../src/ledger/testnet.ts';

/**
 * Runs a spike against Testnet. Any error stops the spike, is reported by
 * message only, and sets a failing exit code.
 */
export async function runSpike(name: string, body: (client: Client) => Promise<void>): Promise<void> {
  const client = new Client(TESTNET_URL);
  try {
    console.log(`spike:${name} on ${TESTNET_URL}`);
    await client.connect();
    await body(client);
    console.log(`\nspike:${name} finished.`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`\nspike:${name} stopped: ${message}`);
    process.exitCode = 1;
  } finally {
    if (client.isConnected()) await client.disconnect();
  }
}
