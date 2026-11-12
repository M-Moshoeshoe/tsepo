import { Client } from 'xrpl';
import { TESTNET_URL } from '../ledger/testnet.ts';

/**
 * Runs a script against Testnet. Any error stops the script, is reported by
 * message only, and sets a failing exit code.
 */
export async function runScript(label: string, body: (client: Client) => Promise<void>): Promise<void> {
  const client = new Client(TESTNET_URL);
  try {
    console.log(`${label} on ${TESTNET_URL}`);
    await client.connect();
    await body(client);
    console.log(`\n${label} finished.`);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`\n${label} stopped: ${message}`);
    process.exitCode = 1;
  } finally {
    if (client.isConnected()) await client.disconnect();
  }
}
