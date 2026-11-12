import {
  AccountSetAsfFlags,
  convertStringToHex,
  isoTimeToRippleTime,
  LedgerEntry,
  type AccountSet,
  type Client,
  type CredentialAccept,
  type CredentialCreate,
  type CredentialDelete,
  type SignerListSet,
  type SubmittableTransaction,
  type Wallet,
} from 'xrpl';
import { isAccepted } from '../domain/credential-check.ts';
import { mandateFingerprint } from '../domain/fingerprint.ts';
import type { Mandate } from '../domain/mandate.ts';
import { agentCredentialQuery, CREDENTIAL_TYPE_HEX } from '../ledger/credential.ts';
import { findCredential, getSignerList, requireAccountState } from '../ledger/reads.ts';
import { signMulti, signSingle, submitAndConfirm, type BeforeSubmit, type Signed } from '../ledger/submit.ts';
import { AGENT_SIGNER_QUORUM, agentSignerEntries, isAgentSignerList } from './signer-list.ts';

export interface RegistryDeps {
  client: Client;
  /** The Tšepo issuer key. It issues AGENT_MANDATE credentials. */
  issuer: Wallet;
  /** The business key: the recovery key on the agent account, and the only key that administers it. */
  business: Wallet;
  agentSignerAddress: string;
  policyAddress: string;
  beforeSubmit?: BeforeSubmit;
}

export interface RegistryStep {
  action: string;
  /** Undefined when the step was already done and nothing was submitted. */
  hash: string | undefined;
}

export interface Registry {
  /**
   * Puts a new agent account under Tšepo control: signer list, master key
   * disabled, credential issued and accepted. Needs the agent master key
   * only while it is still enabled. Safe to run again.
   */
  registerAgent(mandate: Mandate, agentMaster?: Wallet): Promise<RegistryStep[]>;
  /** Issues (or re-issues) the credential so that it proves exactly this mandate. */
  issueCredential(mandate: Mandate): Promise<RegistryStep[]>;
  /** The business deletes the agent credential from the agent account. Takes effect at once. */
  revokeAgent(agent: string): Promise<RegistryStep[]>;
}

export function createRegistry(deps: RegistryDeps): Registry {
  const { client, issuer, business } = deps;
  const signers = { business: business.address, agentSigner: deps.agentSignerAddress, policy: deps.policyAddress };

  async function submit(action: string, signed: Signed): Promise<RegistryStep> {
    const outcome = await submitAndConfirm(client, signed, deps.beforeSubmit);
    return { action, hash: outcome.hash };
  }

  /** Signs an administrative transaction on the agent account: master key while enabled, then the business key alone. */
  async function signForAgentAccount(tx: SubmittableTransaction, agentMaster: Wallet | undefined): Promise<Signed> {
    const { flags } = await requireAccountState(client, tx.Account);
    const masterEnabled = (flags & LedgerEntry.AccountRootFlags.lsfDisableMaster) === 0;
    if (masterEnabled) {
      if (agentMaster === undefined) throw new Error('The agent master key is still enabled; registration needs it');
      return signSingle(client, agentMaster, tx);
    }
    if (!isAgentSignerList(await getSignerList(client, tx.Account), signers)) {
      throw new Error('The agent signer list does not include the business recovery key');
    }
    return signMulti(client, [business], tx);
  }

  async function issueCredential(mandate: Mandate, agentMaster?: Wallet): Promise<RegistryStep[]> {
    const steps: RegistryStep[] = [];
    const query = agentCredentialQuery(mandate.agent, issuer.address);
    const fingerprint = mandateFingerprint(mandate);
    const expiration = isoTimeToRippleTime(mandate.expiresAt);

    let found = await findCredential(client, query);
    if (found !== undefined && (found.entry.uri !== fingerprint || found.entry.expiration !== expiration)) {
      const remove: CredentialDelete = {
        TransactionType: 'CredentialDelete',
        Account: issuer.address,
        Subject: mandate.agent,
        CredentialType: CREDENTIAL_TYPE_HEX,
      };
      steps.push(await submit('delete credential for the previous mandate', await signSingle(client, issuer, remove)));
      found = undefined;
    }

    if (found === undefined) {
      const create: CredentialCreate = {
        TransactionType: 'CredentialCreate',
        Account: issuer.address,
        Subject: mandate.agent,
        CredentialType: CREDENTIAL_TYPE_HEX,
        Expiration: expiration,
        URI: convertStringToHex(fingerprint),
      };
      steps.push(await submit('issue AGENT_MANDATE credential', await signSingle(client, issuer, create)));
      found = await findCredential(client, query);
      if (found === undefined) throw new Error('The credential is missing after it was issued');
    }

    if (isAccepted(found.entry.flags)) {
      steps.push({ action: 'credential already accepted', hash: undefined });
    } else {
      const accept: CredentialAccept = {
        TransactionType: 'CredentialAccept',
        Account: mandate.agent,
        Issuer: issuer.address,
        CredentialType: CREDENTIAL_TYPE_HEX,
      };
      steps.push(await submit('accept credential on the agent account', await signForAgentAccount(accept, agentMaster)));
    }
    return steps;
  }

  async function registerAgent(mandate: Mandate, agentMaster?: Wallet): Promise<RegistryStep[]> {
    if (mandate.principal !== business.address) throw new Error('The mandate names a different business');
    const steps: RegistryStep[] = [];
    const agent = mandate.agent;

    if (isAgentSignerList(await getSignerList(client, agent), signers)) {
      steps.push({ action: 'signer list already in place', hash: undefined });
    } else {
      const signerList: SignerListSet = {
        TransactionType: 'SignerListSet',
        Account: agent,
        SignerQuorum: AGENT_SIGNER_QUORUM,
        SignerEntries: agentSignerEntries(signers),
      };
      steps.push(await submit('set signer list', await signForAgentAccount(signerList, agentMaster)));
    }

    const { flags } = await requireAccountState(client, agent);
    if ((flags & LedgerEntry.AccountRootFlags.lsfDisableMaster) !== 0) {
      steps.push({ action: 'master key already disabled', hash: undefined });
    } else {
      const disable: AccountSet = { TransactionType: 'AccountSet', Account: agent, SetFlag: AccountSetAsfFlags.asfDisableMaster };
      steps.push(await submit('disable agent master key', await signForAgentAccount(disable, agentMaster)));
    }

    steps.push(...(await issueCredential(mandate, agentMaster)));
    return steps;
  }

  async function revokeAgent(agent: string): Promise<RegistryStep[]> {
    if ((await findCredential(client, agentCredentialQuery(agent, issuer.address))) === undefined) {
      return [{ action: 'credential already revoked', hash: undefined }];
    }
    const remove: CredentialDelete = {
      TransactionType: 'CredentialDelete',
      Account: agent,
      Issuer: issuer.address,
      CredentialType: CREDENTIAL_TYPE_HEX,
    };
    return [await submit('business revokes the agent credential', await signForAgentAccount(remove, undefined))];
  }

  return { registerAgent, issueCredential: (mandate) => issueCredential(mandate), revokeAgent };
}
