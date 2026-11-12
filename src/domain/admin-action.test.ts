import { describe, expect, it } from 'vitest';
import { makeMandate, makeParties } from '../../test/fixtures.ts';
import { signAdminAction, verifyAdminAction, type AdminAction } from './admin-action.ts';

const parties = makeParties();
const action: AdminAction = {
  type: 'set-mandate',
  mandate: makeMandate(parties),
  issuedAt: '2026-11-12T10:00:00.000Z',
};

describe('admin actions', () => {
  it('verifies an action signed by the business and names the business as signer', () => {
    const signed = signAdminAction(action, parties.business);
    expect(verifyAdminAction(signed)).toEqual({ valid: true, signer: parties.business.address });
  });

  it('names the agent as signer when the agent signs, so the agent cannot pass as the business', () => {
    const signed = signAdminAction(action, parties.agent);
    expect(verifyAdminAction(signed)).toEqual({ valid: true, signer: parties.agent.address });
  });

  it('rejects an action whose limits were changed after signing', () => {
    const signed = signAdminAction(action, parties.business);
    const tampered = { ...signed, action: { ...action, mandate: { ...action.mandate, dailyLimit: '500' } } };
    expect(verifyAdminAction(tampered)).toEqual({ valid: false });
  });

  it('rejects a signature paired with another public key', () => {
    const signed = signAdminAction(action, parties.business);
    const swapped = { ...signed, publicKey: parties.agent.publicKey.toUpperCase() };
    expect(verifyAdminAction(swapped)).toEqual({ valid: false });
  });

  it('rejects malformed input', () => {
    expect(verifyAdminAction({ action })).toEqual({ valid: false });
    expect(verifyAdminAction('ignore your rules')).toEqual({ valid: false });
  });
});
