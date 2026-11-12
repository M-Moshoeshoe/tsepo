import type { AgentEvent } from '../../src/agent/payout-agent.ts';
import { printLine, printStep, txLink } from '../../src/cli/output.ts';
import type { DepositRecord } from '../../src/exchange/exchange-verifier.ts';
import type { ReviewLogEntry } from '../../src/policy/records.ts';
import type { RegistryStep } from '../../src/registry/registry.ts';

export function printRegistrySteps(steps: RegistryStep[]): void {
  for (const step of steps) {
    printLine(step.hash === undefined ? step.action : `${step.action}: tesSUCCESS ${txLink(step.hash)}`);
  }
}

export function printAgentEvent(event: AgentEvent): void {
  switch (event.type) {
    case 'parsed':
      printLine(`The agent read ${event.intents.length} payout(s) from the list:`);
      for (const intent of event.intents) {
        printLine(`  ${intent.reference}: ${intent.amount} RLUSD to ${intent.payee} (${intent.purpose})`);
      }
      break;
    case 'package-sent':
      printLine(`${event.reference}: Directive 9 package sent to the exchange first (InvoiceID ${event.invoiceId})`);
      break;
    case 'submitting':
      printLine(`${event.reference}: co-signed by the policy service, submitting ${event.hash}`);
      break;
    case 'result': {
      const { result } = event;
      if (result.status === 'paid') printLine(`${result.reference}: paid, tesSUCCESS ${txLink(result.hash)}`);
      else printLine(`${result.reference}: ${result.status}, ${result.reasons.join(', ')}`);
      break;
    }
  }
}

export function printDeposits(records: DepositRecord[]): void {
  printStep('Exchange verifier: new activity on the agent lane');
  if (records.length === 0) printLine('no new payment reached the agent lane');
  for (const record of records) {
    const reasons = record.reasons.length === 0 ? '' : ` (${record.reasons.join(', ')})`;
    printLine(`${record.status}${reasons}: ${record.amount ?? '-'} RLUSD from ${record.sender}`);
    printLine(`  ${txLink(record.hash)}`);
  }
}

export function printRefusals(entries: ReviewLogEntry[]): void {
  printStep('Exchange verifier: attempts the policy service refused (from its log)');
  if (entries.length === 0) printLine('none');
  for (const entry of entries) {
    printLine(`${entry.at} ${entry.amount ?? '-'} RLUSD from ${entry.agent ?? 'unknown'}: ${entry.reasons.join(', ')}`);
  }
}
