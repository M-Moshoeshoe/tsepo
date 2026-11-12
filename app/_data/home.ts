import 'server-only';
import { DEMO_AGENT_NAME } from '../../src/config/demo.ts';
import { agentCredentialQuery } from '../../src/ledger/credential.ts';
import { findCredential, getCredentialHistory } from '../../src/ledger/reads.ts';
import { countByFilter, itemsSince } from '../../src/views/desk.ts';
import { SCENARIOS, type ScenarioKind } from '../../src/views/scenarios.ts';
import { dailyUsage, type DailyUsage } from '../../src/views/usage.ts';
import { collectDeskEntries, type DeskEntry } from './desk-entries.ts';
import { withDemo } from './ledger.ts';
import { agentStatus, type AgentStatus } from './registry.ts';

export interface LastResult {
  at: string;
  outcome: 'finished' | 'stopped';
  /** The plain summary of a finished run. Not kept for a stopped run, whose error text is for the server log. */
  summary: string | undefined;
}

export interface HomeView {
  agentName: string;
  agentStatus: AgentStatus;
  usage: DailyUsage | undefined;
  lastResetAt: string | undefined;
  clearedSinceReset: number;
  refusedSinceReset: { total: number; byPolicy: number; byLedger: number };
  lastResults: Partial<Record<ScenarioKind, LastResult>>;
  /** The five newest payments and stopped attempts. */
  recent: DeskEntry[];
}

/** The home metrics, runbook results and recent activity, read from the ledger and the service records. */
export async function loadHome(): Promise<HomeView> {
  return withDemo(async (ctx) => {
    const { client, wallets } = ctx;
    const agent = wallets.agent.address;
    const issuer = wallets.issuer.address;
    const query = agentCredentialQuery(agent, issuer);

    const [credential, history, mandate, usedToday, desk, runs] = await Promise.all([
      findCredential(client, query),
      getCredentialHistory(client, query),
      ctx.policy.currentMandate(agent),
      ctx.policy.todaysTotal(agent),
      collectDeskEntries(ctx),
      ctx.demo.lastRuns(),
    ]);

    const counts = countByFilter(itemsSince(desk.entries, desk.lastResetAt));
    const lastResults: Partial<Record<ScenarioKind, LastResult>> = {};
    for (const run of runs) {
      const scenario = SCENARIOS.find((item) => item.kind === run.kind);
      if (scenario === undefined) continue;
      lastResults[scenario.kind] = {
        at: run.at,
        outcome: run.outcome,
        summary: run.outcome === 'finished' ? run.summary : undefined,
      };
    }

    return {
      agentName: DEMO_AGENT_NAME,
      agentStatus: agentStatus({ credential, history, mandate, issuer, agent }),
      usage: mandate === undefined ? undefined : dailyUsage(usedToday, mandate.dailyLimit),
      lastResetAt: desk.lastResetAt,
      clearedSinceReset: counts.cleared,
      refusedSinceReset: { total: counts.refused + counts.rejected, byPolicy: counts.refused, byLedger: counts.rejected },
      lastResults,
      recent: itemsSince(desk.entries, undefined).slice(0, 5),
    };
  });
}
