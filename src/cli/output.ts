import { TESTNET_EXPLORER } from '../ledger/testnet.ts';

export function txLink(hash: string): string {
  return `${TESTNET_EXPLORER}/transactions/${hash}`;
}

export function accountLink(address: string): string {
  return `${TESTNET_EXPLORER}/accounts/${address}`;
}

export function printStep(title: string): void {
  console.log(`\n${title}`);
}

export function printLine(text: string): void {
  console.log(`  ${text}`);
}

export function printTx(result: string, hash: string): void {
  printLine(`${result} ${hash}`);
  printLine(txLink(hash));
}
