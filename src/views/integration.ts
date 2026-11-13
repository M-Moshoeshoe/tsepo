/** The regions of examples/exchange-integration.ts that the Integrate page shows, in the order it shows them. */
export const INTEGRATION_REGIONS = ['constants', 'submit', 'step-1', 'step-1-check', 'step-2', 'step-3'] as const;

export type IntegrationRegion = (typeof INTEGRATION_REGIONS)[number];

/** The command that runs the example, and what its output looks like on Testnet. Addresses and hashes differ on every run. */
export const EXAMPLE_COMMAND = 'npm run example:integration';

export const EXAMPLE_OUTPUT = `Tšepo exchange integration on the XRP Ledger Testnet

Step 0. Create a test exchange account
  funded rBwftNZXYXeUZm41E7dWwthf7nPzdDoi5Z from the Testnet faucet

Step 1. Turn on credential-based Deposit Authorization
  submitting AccountSet 6BEB0D24...0A69B4
  tesSUCCESS
  submitting DepositPreauth 19D47B89...3F57A1
  tesSUCCESS
  Check: an account without a Tšepo credential pays 1 XRP to the deposit address
  submitting Payment 281057EC...58831C
  rejected with tecNO_PERMISSION, as expected

Step 2. Check an agent’s Tšepo credential
  rMQqusFUcxkKhbETdS7nMF4ELhJ9QciiPp: Verified. Rules fingerprint sha256:7506c19b...179b52
  rwAppV9jGbEv5tfmp1Tz1629uzrF5E77a6: Not verified, no Tšepo credential

Step 3. Match the Travel Rule details by fingerprint
  payment F862AD64...786800: matched. The InvoiceID is the fingerprint of the details, and the sender, the deposit address and the rules agree.

Done. Every step passed.`;
