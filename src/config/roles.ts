/**
 * Every account and key the spikes use. `ownedObjects` is the number of
 * ledger objects the account will own by the end of Phase 1, used to check
 * it holds enough XRP for its reserve.
 */
export const ROLES = {
  issuer: { seedVar: 'ISSUER_SEED', funded: true, ownedObjects: 1 }, // credential until accepted
  business: { seedVar: 'BUSINESS_SEED', funded: true, ownedObjects: 0 },
  agent: { seedVar: 'AGENT_SEED', funded: true, ownedObjects: 3 }, // trust line, credential, signer list
  agentSigner: { seedVar: 'AGENT_SIGNER_SEED', funded: false, ownedObjects: 0 }, // signing key only
  policy: { seedVar: 'POLICY_SEED', funded: true, ownedObjects: 0 },
  exchange: { seedVar: 'EXCHANGE_SEED', funded: true, ownedObjects: 2 }, // trust line, deposit preauth
  contractor: { seedVar: 'CONTRACTOR_SEED', funded: true, ownedObjects: 1 }, // trust line
  unknownAgent: { seedVar: 'UNKNOWN_AGENT_SEED', funded: true, ownedObjects: 1 }, // trust line; holds no credential
} as const;

export type Role = keyof typeof ROLES;

export const ROLE_NAMES = Object.keys(ROLES) as Role[];
