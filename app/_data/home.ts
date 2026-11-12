import 'server-only';
import { DEMO_AGENT_NAME } from '../../src/config/demo.ts';
import { agentCredentialQuery } from '../../src/ledger/credential.ts';
import { findCredential, getCredentialHistory } from '../../src/ledger/reads.ts';
import { countByFilter, itemsSince, stoppedSummary, type StoppedSummary } from '../../src/views/desk.ts';
import { dailyUsage, type DailyUsage } from '../../src/views/usage.ts';
import { collectDeskEntries, type DeskEntry } from './desk-entries.ts';
import { withDemo } from './ledger.ts';
import { agentStatus, type AgentStatus } from './registry.ts';

export interface HomeView {
  agentName: string;
  agentStatus: AgentStatus;
  usage: DailyUsage | undefined;
  lastResetAt: string | undefined;
  clearedSinceReset: number;
  stoppedSinceReset: StoppedSummary;
  /** The five newest payments and stopped attempts. */
  recent: DeskEntry[];
}

/** The Business Overview figures and recent activity, read from the ledger and the service records. */
export async function loadHome(): Promise<HomeView> {
  return withDemo(async (ctx) => {
    const { client, wallets } = ctx;
    const agent = wallets.agent.address;
    const issuer = wallets.issuer.address;
    const query = agentCredentialQuery(agent, issuer);

    const [credential, history, mandate, usedToday, desk] = await Promise.all([
      findCredential(client, query),
      getCredentialHistory(client, query),
      ctx.policy.currentMandate(agent),
      ctx.policy.todaysTotal(agent),
      collectDeskEntries(ctx),
    ]);

    const sinceReset = itemsSince(desk.entries, desk.lastResetAt);
    return {
      agentName: DEMO_AGENT_NAME,
      agentStatus: agentStatus({ credential, history, mandate, issuer, agent }),
      usage: mandate === undefined ? undefined : dailyUsage(usedToday, mandate.dailyLimit),
      lastResetAt: desk.lastResetAt,
      clearedSinceReset: countByFilter(sinceReset).cleared,
      stoppedSinceReset: stoppedSummary(sinceReset),
      recent: itemsSince(desk.entries, undefined).slice(0, 5),
    };
  });
}
