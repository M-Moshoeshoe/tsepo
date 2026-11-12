/** One plain line for each term a newcomer may not know. */
export const GLOSSARY = {
  'travel-rule':
    'The rule that sender and receiver details travel with a crypto payment; in South Africa it is FIC Directive 9.',
  credential: 'A record on the XRP Ledger, issued by Tšepo and accepted by the agent, that proves the agent holds a current mandate.',
  'agent-lane': 'An exchange deposit account that the ledger lets an agent pay only if the agent holds a valid credential.',
  fingerprint: 'A short code worked out from the full content; change one character of the content and the code changes.',
  quorum: 'The total signer weight a transaction needs. Here 2: the agent key and the policy service together, or the business key alone.',
  tecNO_PERMISSION: 'The ledger result when the sender has no permission to pay that account, here because it holds no credential.',
  tecBAD_CREDENTIALS: 'The ledger result when a payment presents a credential that is missing, expired or not accepted.',
} as const;

export type GlossaryTerm = keyof typeof GLOSSARY;

export function isGlossaryTerm(value: string): value is GlossaryTerm {
  return Object.hasOwn(GLOSSARY, value);
}
