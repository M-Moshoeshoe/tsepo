import { toUnits } from '../domain/amount.ts';
import { signAdminAction } from '../domain/admin-action.ts';
import { mandateFingerprint } from '../domain/fingerprint.ts';
import { agentCredentialQuery } from '../ledger/credential.ts';
import { findCredential } from '../ledger/reads.ts';
import { rlusdBalance, rlusdPayment } from '../ledger/rlusd.ts';
import { signSingle, submitAndConfirm } from '../ledger/submit.ts';
import { reasonText } from '../views/status.ts';
import type { DemoContext } from './context.ts';
import { DemoError } from './errors.ts';
import type { Report } from './events.ts';

/** Accounts whose RLUSD goes back to the agent. */
const HOLDERS = ['exchange', 'contractor', 'unknownAgent'] as const;

/** What a scenario needs before it starts. */
export interface ScenarioNeeds {
  /** RLUSD the agent will pay in this scenario. */
  rlusd: string;
  /** True when the scenario uses the registered agent. */
  agent: boolean;
}

export interface DemoReadiness {
  agentBalance: string;
  /** The policy service holds the demo mandate, with the demo limits. */
  demoMandateApplied: boolean;
  /** The agent holds an accepted-or-pending credential that proves the demo mandate. */
  credentialProvesDemoMandate: boolean;
}

export type PreparationStep = 'return-rlusd' | 'restore-mandate' | 'register-agent' | 'clear-demo-records';

/** A balance that cannot be read as a plain decimal counts as too low, so the RLUSD is returned. */
function holdsAtLeast(balance: string, needed: string): boolean {
  try {
    return toUnits(balance) >= toUnits(needed);
  } catch {
    return false;
  }
}

/**
 * What must change before a scenario runs, so the scenarios work in any
 * order. A pure function: the run carries the steps out and logs each one.
 */
export function planPreparation(needs: ScenarioNeeds, readiness: DemoReadiness): PreparationStep[] {
  if (!needs.agent) return [];
  const steps: PreparationStep[] = [];
  if (!holdsAtLeast(readiness.agentBalance, needs.rlusd)) steps.push('return-rlusd');
  if (!readiness.demoMandateApplied) steps.push('restore-mandate');
  if (!readiness.demoMandateApplied || !readiness.credentialProvesDemoMandate) steps.push('register-agent');
  steps.push('clear-demo-records');
  return steps;
}

/** Returns every holder's RLUSD to the agent. Used by Reset and by preparation. */
export async function returnRlusdToAgent(ctx: DemoContext, report: Report): Promise<void> {
  const { client, wallets } = ctx;
  for (const holder of HOLDERS) {
    const balance = await rlusdBalance(client, wallets[holder].address);
    if (Number(balance) <= 0) continue;
    report({ type: 'line', text: `${holder} returns ${balance} RLUSD` });
    const signed = await signSingle(client, wallets[holder], rlusdPayment(wallets[holder].address, wallets.agent.address, balance));
    const outcome = await submitAndConfirm(client, signed);
    report({ type: 'line', text: 'tesSUCCESS', hash: outcome.hash });
  }
}

/** The business signs the demo mandate and the policy service applies it. */
export async function applyDemoMandate(ctx: DemoContext): Promise<void> {
  const action = { type: 'set-mandate' as const, mandate: ctx.mandate, issuedAt: new Date().toISOString() };
  const applied = await ctx.policy.applyAdminAction(signAdminAction(action, ctx.wallets.business));
  if (!applied.applied) {
    throw new DemoError(`The approval service did not accept the sample limits: ${reasonText(applied.reason)}.`);
  }
}

async function readReadiness(ctx: DemoContext): Promise<DemoReadiness> {
  const agent = ctx.wallets.agent.address;
  const demoFingerprint = mandateFingerprint(ctx.mandate);
  const [agentBalance, current, credential] = await Promise.all([
    rlusdBalance(ctx.client, agent),
    ctx.policy.currentMandate(agent),
    findCredential(ctx.client, agentCredentialQuery(agent, ctx.wallets.issuer.address)),
  ]);
  return {
    agentBalance,
    demoMandateApplied: current !== undefined && mandateFingerprint(current) === demoFingerprint,
    credentialProvesDemoMandate: credential?.entry.uri === demoFingerprint,
  };
}

/**
 * Puts the demo in the state a scenario expects, and says so in the run
 * log. Demo only: in production nobody clears totals or re-registers an agent
 * on its behalf.
 */
export async function prepareScenario(ctx: DemoContext, report: Report, needs: ScenarioNeeds): Promise<void> {
  report({ type: 'step', text: 'Setting up the sample workspace' });
  const steps = planPreparation(needs, await readReadiness(ctx));
  if (steps.length === 0) report({ type: 'line', text: 'Nothing to set up for this story' });
  for (const step of steps) {
    switch (step) {
      case 'return-rlusd':
        report({ type: 'line', text: 'The agent holds too little RLUSD, so the RLUSD goes back to the agent' });
        await returnRlusdToAgent(ctx, report);
        break;
      case 'restore-mandate':
        report({ type: 'line', text: `The business restores the sample limits: ${ctx.mandate.perPaymentLimit} RLUSD per payment, ${ctx.mandate.dailyLimit} RLUSD per day` });
        await applyDemoMandate(ctx);
        break;
      case 'register-agent':
        report({ type: 'line', text: 'Tšepo registers the agent again with the sample spending rules' });
        for (const registryStep of await ctx.registry.registerAgent(ctx.mandate)) {
          report({ type: 'line', text: registryStep.hash === undefined ? registryStep.action : `${registryStep.action}: tesSUCCESS`, hash: registryStep.hash });
        }
        break;
      case 'clear-demo-records':
        report({ type: 'line', text: "Clear today's sample totals and payment records, so this story starts fresh" });
        await ctx.policy.clearDailyTotalsForDemo();
        await ctx.agentStore.clear('payouts');
        break;
    }
  }
}
