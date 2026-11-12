/** One plain line for each term a newcomer may not know. */
export const GLOSSARY = {
  'travel-rule':
    'Sender and receiver details that travel with a crypto payment. In South Africa: FIC Directive 9, for every transfer from R0.',
  credential: 'A record on the XRP Ledger, issued by Tšepo, that proves the agent holds current spending rules. It holds no personal data.',
  'spending-rules':
    'What the agent may do: who it may pay, how much per payment and per day, and until when. Also called the mandate.',
  'approval-service': 'An independent service that holds the second key. It approves a payment only within the spending rules.',
  'agent-deposit-address':
    'An exchange deposit address that the XRP Ledger lets an agent pay only if it holds a valid Tšepo credential.',
  fingerprint: 'A short code worked out from the full content; change one character of the content and the code changes.',
  'signatures-needed':
    'The total key weight a payment needs. Here 2: the agent and the approval service together, or the business key alone.',
  testnet: 'XRP Ledger Testnet: a public test network. Test funds only; no real money moves.',
  'sample-workspace':
    'The businesses and people here are invented. The payments and credentials are real, on the XRP Ledger Testnet, with test funds.',
  tecNO_PERMISSION: 'The ledger result when the sender has no permission to pay that address, here because it holds no credential.',
  tecBAD_CREDENTIALS: 'The ledger result when a payment presents a credential that is missing, expired or not accepted.',
} as const;

export type GlossaryTerm = keyof typeof GLOSSARY;

export function isGlossaryTerm(value: string): value is GlossaryTerm {
  return Object.hasOwn(GLOSSARY, value);
}
