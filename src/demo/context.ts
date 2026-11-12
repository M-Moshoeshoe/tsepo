import type { Client } from 'xrpl';
import { createPayeeDirectory } from '../agent/payee-directory.ts';
import { createPayoutAgent, type AgentEvent, type PayoutAgent } from '../agent/payout-agent.ts';
import { createDailyCallBudget, DAILY_MODEL_CALL_LIMIT, withCallBudget } from '../agent/call-budget.ts';
import { createClaudePayoutParser, type PayoutParser } from '../agent/payout-parser.ts';
import { DEMO_BUSINESS, DEMO_PAYEES, demoMandate } from '../config/demo.ts';
import { loadEnv, type Env } from '../config/env.ts';
import { loadWallets, type Wallets } from '../config/wallets.ts';
import type { Mandate } from '../domain/mandate.ts';
import { createExchangeVerifier, type ExchangeVerifier } from '../exchange/exchange-verifier.ts';
import { findCredential } from '../ledger/reads.ts';
import { createPolicyService, type PolicyService } from '../policy/policy-service.ts';
import { createRegistry, type Registry } from '../registry/registry.ts';
import { createFileStore } from '../storage/file-store.ts';
import type { DocumentStore } from '../storage/store.ts';
import type { Report } from './events.ts';
import { demoState, type DemoState } from './state.ts';

export interface DemoContext {
  client: Client;
  env: Env;
  wallets: Wallets;
  mandate: Mandate;
  policy: PolicyService;
  exchange: ExchangeVerifier;
  registry: Registry;
  agentStore: DocumentStore;
  demo: DemoState;
  /** Uses Claude, capped at 50 calls a day, to read payout lists unless another parser is given. */
  createAgent(onEvent: (event: AgentEvent) => void, parser?: PayoutParser): PayoutAgent;
}

/**
 * Wires every service for the demo. Each service gets its own key and its
 * own store directory; they talk only through the interfaces passed here.
 */
export function createDemoContext(client: Client, report: Report): DemoContext {
  const env = loadEnv();
  const wallets = loadWallets(env);
  const issuerAddress = wallets.issuer.address;
  const laneAddress = wallets.exchange.address;

  const policy = createPolicyService({
    wallet: wallets.policy,
    store: createFileStore('.data/policy'),
    issuerAddress,
    readCredential: (query) => findCredential(client, query),
  });
  const exchange = createExchangeVerifier({
    client,
    store: createFileStore('.data/exchange'),
    laneAddress,
    issuerAddress,
    readPolicyLog: () => policy.readLog(),
  });
  const registry = createRegistry({
    client,
    issuer: wallets.issuer,
    business: wallets.business,
    agentSignerAddress: wallets.agentSigner.address,
    policyAddress: wallets.policy.address,
    beforeSubmit: (hash) => {
      report({ type: 'line', text: 'Submitting to the ledger', hash });
    },
  });
  const agentStore = createFileStore('.data/agent');
  const directory = createPayeeDirectory(DEMO_PAYEES.map((payee) => ({ ...payee, ledgerAddress: laneAddress })));

  return {
    client,
    env,
    wallets,
    mandate: demoMandate(wallets),
    policy,
    exchange,
    registry,
    agentStore,
    demo: demoState(createFileStore('.data/demo')),
    createAgent: (onEvent, parser = withCallBudget(createClaudePayoutParser(), createDailyCallBudget(agentStore, DAILY_MODEL_CALL_LIMIT))) =>
      createPayoutAgent({
        client,
        agentAddress: wallets.agent.address,
        signer: wallets.agentSigner,
        issuerAddress,
        sourceTag: env.sourceTag,
        business: DEMO_BUSINESS,
        parser,
        directory,
        policy,
        exchange,
        store: agentStore,
        onEvent,
      }),
  };
}
