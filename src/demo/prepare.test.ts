import { describe, expect, it } from 'vitest';
import { planPreparation, type DemoReadiness, type ScenarioNeeds } from './prepare.ts';

const READY: DemoReadiness = { agentBalance: '10', demoMandateApplied: true, credentialProvesDemoMandate: true };
const NEEDS: Record<'s1' | 's2' | 's3' | 's4', ScenarioNeeds> = {
  s1: { rlusd: '0', agent: false },
  s2: { rlusd: '2', agent: true },
  s3: { rlusd: '4', agent: true },
  s4: { rlusd: '0', agent: true },
};

describe('scenario preparation', () => {
  it('always starts a scenario that uses the agent from clear demo totals', () => {
    expect(planPreparation(NEEDS.s2, READY)).toEqual(['clear-demo-records']);
  });

  it('changes nothing for scenario 1, which uses an unregistered agent', () => {
    expect(planPreparation(NEEDS.s1, { agentBalance: '0', demoMandateApplied: false, credentialProvesDemoMandate: false })).toEqual([]);
  });

  it('registers the agent again after a revocation', () => {
    expect(planPreparation(NEEDS.s2, { ...READY, credentialProvesDemoMandate: false })).toEqual(['register-agent', 'clear-demo-records']);
  });

  it('restores the demo limits after the business changed them, and issues a credential for them', () => {
    expect(planPreparation(NEEDS.s3, { ...READY, demoMandateApplied: false, credentialProvesDemoMandate: false })).toEqual([
      'restore-mandate',
      'register-agent',
      'clear-demo-records',
    ]);
  });

  it('returns the RLUSD when the agent holds less than the scenario pays', () => {
    expect(planPreparation(NEEDS.s3, { ...READY, agentBalance: '2' })).toEqual(['return-rlusd', 'clear-demo-records']);
    expect(planPreparation(NEEDS.s3, { ...READY, agentBalance: '4' })).toEqual(['clear-demo-records']);
    // A balance that is not a plain decimal counts as too low.
    expect(planPreparation(NEEDS.s3, { ...READY, agentBalance: '1e3' })).toEqual(['return-rlusd', 'clear-demo-records']);
  });

  it('lets scenarios 2, 3, 4 and 2 run in that order without a reset', () => {
    // The ledger state each scenario leaves behind, as the runs showed on Testnet.
    let state: DemoReadiness = { ...READY };
    const order: { needs: ScenarioNeeds; after: (s: DemoReadiness) => DemoReadiness }[] = [
      { needs: NEEDS.s2, after: (s) => ({ ...s, agentBalance: '8' }) },
      { needs: NEEDS.s3, after: (s) => ({ ...s, agentBalance: '4' }) },
      { needs: NEEDS.s4, after: (s) => ({ ...s, credentialProvesDemoMandate: false }) },
      { needs: NEEDS.s2, after: (s) => ({ ...s, agentBalance: '2' }) },
    ];
    const plans = order.map(({ needs, after }) => {
      const plan = planPreparation(needs, state);
      state = after({ ...state, credentialProvesDemoMandate: state.credentialProvesDemoMandate || plan.includes('register-agent') });
      return plan;
    });
    expect(plans).toEqual([['clear-demo-records'], ['clear-demo-records'], ['clear-demo-records'], ['register-agent', 'clear-demo-records']]);
    // A fifth run, scenario 3, would find 2 RLUSD and return the rest first.
    expect(planPreparation(NEEDS.s3, state)).toEqual(['return-rlusd', 'clear-demo-records']);
  });
});
