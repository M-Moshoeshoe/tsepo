import { describe, expect, it } from 'vitest';
import { makeParties } from '../../test/fixtures.ts';
import { agentSignerEntries, isAgentSignerList } from './signer-list.ts';

const parties = makeParties();
const addresses = { business: parties.business.address, agentSigner: parties.agent.address, policy: parties.issuer.address };

describe('agent signer list', () => {
  it('gives the business weight 2 and the agent and policy keys weight 1', () => {
    expect(agentSignerEntries(addresses).map(({ SignerEntry }) => SignerEntry.SignerWeight)).toEqual([2, 1, 1]);
  });

  it('recognises the list in any order', () => {
    const entries = [...agentSignerEntries(addresses)].reverse();
    expect(isAgentSignerList({ SignerQuorum: 2, SignerEntries: entries }, addresses)).toBe(true);
  });

  it('rejects the Phase 1 list without the business key, a different quorum, or no list', () => {
    const phaseOne = agentSignerEntries(addresses).slice(1);
    expect(isAgentSignerList({ SignerQuorum: 2, SignerEntries: phaseOne }, addresses)).toBe(false);
    expect(isAgentSignerList({ SignerQuorum: 3, SignerEntries: agentSignerEntries(addresses) }, addresses)).toBe(false);
    expect(isAgentSignerList(undefined, addresses)).toBe(false);
  });
});
