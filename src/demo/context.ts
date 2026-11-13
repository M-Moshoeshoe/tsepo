import { join } from 'node:path';
import { createPayeeDirectory } from '../agent/payee-directory.ts';
import { createPayoutAgent, type AgentEvent, type PayoutAgent } from '../agent/payout-agent.ts';
import { createDailyCallBudget, DAILY_MODEL_CALL_LIMIT, withCallBudget } from '../agent/call-budget.ts';
import { createClaudePayoutParser, type PayoutParser } from '../agent/payout-parser.ts';
import { DEMO_BUSINESS, DEMO_PAYEES, demoMandate } from '../config/demo.ts';
import { loadAppEnv, type AppEnv } from '../config/app-env.ts';
import { loadAppWallets, policyAddressOf, type AppWallets } from '../config/wallets.ts';
import type { Mandate } from '../domain/mandate.ts';
import { createExchangeVerifier, type ExchangeVerifier } from '../exchange/exchange-verifier.ts';
import { Wallet, type Client } from 'xrpl';
import { findCredential } from '../ledger/reads.ts';
import { createPolicyClient } from '../policy/http-client.ts';
import { createPolicyService, type PolicyService } from '../policy/policy-service.ts';
import { createRegistry, type Registry } from '../registry/registry.ts';
import { createFileStore } from '../storage/file-store.ts';
import type { DocumentStore } from '../storage/store.ts';
import type { Report } from './events.ts';
import { demoState, type DemoState } from './state.ts';

export interface DemoContext {
  client: Client;
  env: AppEnv;
  wallets: AppWallets;
  /** The policy service's address, for the signer list. Its key is never here when it runs on its own. */
  policyAddress: string;
  mandate: Mandate;
  policy: PolicyService;
  exchange: ExchangeVerifier;
  registry: Registry;
  agentStore: DocumentStore;
  demo: DemoState;
  /** Uses Claude, capped at 150 calls a day, to read payout lists unless another parser is given. */
  createAgent(onEvent: (event: AgentEvent) => void, parser?: PayoutParser): PayoutAgent;
}

/**
 * The policy service: its own deployment, reached over the private network,
 * when POLICY_SERVICE_URL is set; otherwise in-process with its own key and
 * store, as on a developer's machine. Either way the rest sees one interface.
 */
function policyServiceFor(env: AppEnv, client: Client, issuerAddress: string): PolicyService {
  if (env.policy.mode === 'service') return createPolicyClient({ url: env.policy.url, token: env.policy.token });
  return createPolicyService({
    wallet: Wallet.fromSeed(env.policy.seed),
    store: createFileStore(join(env.dataDir, 'policy')),
    issuerAddress,
    readCredential: (query) => findCredential(client, query),
  });
}

/**
 * Wires every service for the demo. Each service gets its own key and its
 * own store directory; they talk only through the interfaces passed here.
 */
export function createDemoContext(client: Client, report: Report): DemoContext {
  const env = loadAppEnv();
  const wallets = loadAppWallets(env);
  const issuerAddress = wallets.issuer.address;
  const laneAddress = wallets.exchange.address;
  const policyAddress = policyAddressOf(env);

  const policy = policyServiceFor(env, client, issuerAddress);
  const exchange = createExchangeVerifier({
    client,
    store: createFileStore(join(env.dataDir, 'exchange')),
    laneAddress,
    issuerAddress,
    readPolicyLog: () => policy.readLog(),
  });
  const registry = createRegistry({
    client,
    issuer: wallets.issuer,
    business: wallets.business,
    agentSignerAddress: wallets.agentSigner.address,
    policyAddress,
    beforeSubmit: (hash) => {
      report({ type: 'line', text: 'Submitting to the ledger', hash });
    },
  });
  const agentStore = createFileStore(join(env.dataDir, 'agent'));
  const directory = createPayeeDirectory(DEMO_PAYEES.map((payee) => ({ ...payee, ledgerAddress: laneAddress })));

  return {
    client,
    env,
    wallets,
    policyAddress,
    mandate: demoMandate(wallets),
    policy,
    exchange,
    registry,
    agentStore,
    demo: demoState(createFileStore(join(env.dataDir, 'demo'))),
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
