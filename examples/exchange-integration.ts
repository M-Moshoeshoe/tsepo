/**
 * Tšepo exchange integration, run end to end on the XRP Ledger Testnet.
 *
 *   npm run example:integration
 *
 * It follows the Integrate page step by step, and the page shows the code
 * between the region markers below exactly as it is written here:
 *
 *   0. Create and fund a test exchange account from the Testnet faucet.
 *   1. Turn on credential-based Deposit Authorization, then prove it: a
 *      sender without a Tšepo credential is rejected by the ledger.
 *   2. Check an agent's Tšepo credential: Lesedi's agent is Verified, and an
 *      unregistered address is Not verified.
 *   3. Match a real payment to its Travel Rule details by fingerprint.
 *
 * Testnet only. Keys are made and used in memory and are never printed or
 * stored; the script prints only addresses, transaction hashes and results.
 */
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { AccountSetAsfFlags, Client, convertHexToString, convertStringToHex, unixTimeToRippleTime, xrpToDrops, type SubmittableTransaction, type Wallet } from 'xrpl';
import { z } from 'zod';

const TESTNET = 'wss://s.altnet.rippletest.net:51233';

// #region constants
// Tšepo's credential issuer on Testnet, as the Integrate page publishes it.
const TSEPO_ISSUER = 'rpS8npJd8eyU7jr1pn2owuUxd5vnM2J66C';
// The credential type Tšepo issues to agents, hex-encoded as the ledger stores it.
const AGENT_MANDATE = convertStringToHex('AGENT_MANDATE');
// #endregion constants

// Lesedi Design Studio's payout agent: a sample agent that holds a Tšepo credential.
const LESEDI_AGENT = 'rMQqusFUcxkKhbETdS7nMF4ELhJ9QciiPp';

const SAMPLE_FILE = new URL('./sample-travel-rule-details.json', import.meta.url);

// #region submit
const SubmitResultSchema = z.object({ result: z.object({ meta: z.object({ TransactionResult: z.string() }).loose() }).loose() });

/**
 * Signs locally and submits one transaction. autofill sets Fee, Sequence and
 * LastLedgerSequence; the hash is recorded before anything is sent; and any
 * result other than tesSUCCESS stops the script instead of being retried.
 */
async function submit(client: Client, wallet: Wallet, transaction: SubmittableTransaction): Promise<string> {
  const signed = wallet.sign(await client.autofill(transaction));
  console.log(`  submitting ${transaction.TransactionType} ${signed.hash}`);
  const { result } = SubmitResultSchema.parse(await client.submitAndWait(signed.tx_blob));
  const code = result.meta.TransactionResult;
  if (code !== 'tesSUCCESS') throw new Error(`${transaction.TransactionType} ended with ${code}, so the script stopped.`);
  console.log(`  ${code}`);
  return signed.hash;
}
// #endregion submit

// #region step-1
/** Only senders that present an accepted AGENT_MANDATE credential from Tšepo can pay this address. */
async function acceptOnlyTsepoAgents(client: Client, exchange: Wallet): Promise<void> {
  // Deposit Authorization: the ledger rejects every payment that is not preauthorised.
  await submit(client, exchange, { TransactionType: 'AccountSet', Account: exchange.address, SetFlag: AccountSetAsfFlags.asfDepositAuth });
  // Preauthorise any sender that holds an accepted AGENT_MANDATE credential from Tšepo.
  await submit(client, exchange, {
    TransactionType: 'DepositPreauth',
    Account: exchange.address,
    AuthorizeCredentials: [{ Credential: { Issuer: TSEPO_ISSUER, CredentialType: AGENT_MANDATE } }],
  });
}
// #endregion step-1

// #region step-1-check
/** A sender without a credential tries to pay: the ledger itself must reject it with tecNO_PERMISSION. */
async function expectRejected(client: Client, sender: Wallet, depositAddress: string): Promise<string> {
  const signed = sender.sign(await client.autofill({ TransactionType: 'Payment', Account: sender.address, Destination: depositAddress, Amount: xrpToDrops('1') }));
  console.log(`  submitting Payment ${signed.hash}`);
  const { result } = SubmitResultSchema.parse(await client.submitAndWait(signed.tx_blob));
  return result.meta.TransactionResult;
}
// #endregion step-1-check

// #region step-2
const CredentialsSchema = z.object({
  result: z.object({
    account_objects: z.array(
      z.object({ Issuer: z.string(), CredentialType: z.string(), Flags: z.number(), Expiration: z.number().optional(), URI: z.string().optional() }).loose(),
    ),
  }),
});

const ACCEPTED = 0x00010000; // lsfAccepted: the agent accepted the credential

type AgentCheck = { verified: true; rulesFingerprint: string } | { verified: false; reason: string };

/** Reads the agent's Tšepo credential from the validated ledger. It counts only when Tšepo issued it, the agent accepted it and it has not expired. */
async function checkAgent(client: Client, agentAddress: string): Promise<AgentCheck> {
  const response = await client.request({ command: 'account_objects', account: agentAddress, type: 'credential', ledger_index: 'validated' });
  const credential = CredentialsSchema.parse(response).result.account_objects.find(
    (entry) => entry.Issuer === TSEPO_ISSUER && entry.CredentialType === AGENT_MANDATE,
  );
  if (credential === undefined) return { verified: false, reason: 'no Tšepo credential' };
  if ((credential.Flags & ACCEPTED) === 0) return { verified: false, reason: 'not accepted by the agent' };
  if (credential.Expiration === undefined || credential.Expiration <= unixTimeToRippleTime(Date.now())) return { verified: false, reason: 'expired' };
  if (credential.URI === undefined) return { verified: false, reason: 'no rules fingerprint' };
  // The URI holds the fingerprint of the agent's spending rules, never personal data.
  return { verified: true, rulesFingerprint: convertHexToString(credential.URI) };
}
// #endregion step-2

// #region step-3
const TravelRuleDetailsSchema = z.object({
  beneficiary: z.object({ ledgerAddress: z.string() }).loose(),
  agent: z.object({ ledgerAddress: z.string(), mandateFingerprint: z.string() }).loose(),
}).loose();

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

/** JSON with object keys sorted at every level, so the same details always give the same text. */
function canonicalJson(value: Json): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value !== null && typeof value === 'object') {
    const members = Object.entries(value)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([key, member]) => `${JSON.stringify(key)}:${canonicalJson(member)}`);
    return `{${members.join(',')}}`;
  }
  return JSON.stringify(value);
}

const PaymentSchema = z.object({
  result: z.object({ tx_json: z.object({ Account: z.string(), Destination: z.string(), InvoiceID: z.string().optional() }).loose() }).loose(),
});

/**
 * Matches a payment to the Travel Rule details the agent sent before it. The
 * payment's InvoiceID is the SHA-256 fingerprint of those details, so a match
 * proves the payment carries exactly these details.
 */
async function matchTravelRule(client: Client, paymentHash: string, details: Json, depositAddress: string, rulesFingerprint: string): Promise<string[]> {
  const payment = PaymentSchema.parse(await client.request({ command: 'tx', transaction: paymentHash })).result.tx_json;
  const facts = TravelRuleDetailsSchema.parse(details);
  const expected = createHash('sha256').update(canonicalJson(details)).digest('hex').toUpperCase();
  const problems: string[] = [];
  if (payment.InvoiceID !== expected) problems.push('the InvoiceID is not the fingerprint of these details');
  if (payment.Destination !== depositAddress || facts.beneficiary.ledgerAddress !== depositAddress) problems.push('it was not paid to this deposit address');
  if (payment.Account !== facts.agent.ledgerAddress) problems.push('it was sent by a different account');
  if (facts.agent.mandateFingerprint !== rulesFingerprint) problems.push('the rules do not match the agent credential');
  return problems; // Hold the payment for review unless this list is empty.
}
// #endregion step-3

const SampleSchema = z.object({ paymentHash: z.string(), details: z.custom<Json>((value) => typeof value === 'object' && value !== null) });

function step(title: string): void {
  console.log(`\n${title}`);
}

const client = new Client(TESTNET);
await client.connect();
try {
  console.log('Tšepo exchange integration on the XRP Ledger Testnet');

  step('Step 0. Create a test exchange account');
  const { wallet: exchange } = await client.fundWallet();
  console.log(`  funded ${exchange.address} from the Testnet faucet`);

  step('Step 1. Turn on credential-based Deposit Authorization');
  await acceptOnlyTsepoAgents(client, exchange);
  console.log('  Check: an account without a Tšepo credential pays 1 XRP to the deposit address');
  const { wallet: stranger } = await client.fundWallet();
  const rejected = await expectRejected(client, stranger, exchange.address);
  if (rejected !== 'tecNO_PERMISSION') throw new Error(`Expected tecNO_PERMISSION, but the ledger returned ${rejected}.`);
  console.log('  rejected with tecNO_PERMISSION, as expected');

  step('Step 2. Check an agent’s Tšepo credential');
  const lesedi = await checkAgent(client, LESEDI_AGENT);
  if (!lesedi.verified) throw new Error(`Lesedi's agent is not verified: ${lesedi.reason}. Restore the sample data in the product first.`);
  console.log(`  ${LESEDI_AGENT}: Verified. Rules fingerprint ${lesedi.rulesFingerprint}`);
  const unknown = await checkAgent(client, stranger.address);
  if (unknown.verified) throw new Error('An unregistered address was verified, so the check is wrong.');
  console.log(`  ${stranger.address}: Not verified, ${unknown.reason}`);

  step('Step 3. Match the Travel Rule details by fingerprint');
  const sample = SampleSchema.parse(JSON.parse(await readFile(SAMPLE_FILE, 'utf8')));
  const laneAddress = TravelRuleDetailsSchema.parse(sample.details).beneficiary.ledgerAddress;
  const problems = await matchTravelRule(client, sample.paymentHash, sample.details, laneAddress, lesedi.rulesFingerprint);
  if (problems.length > 0) throw new Error(`The payment does not match its details: ${problems.join('; ')}.`);
  console.log(`  payment ${sample.paymentHash}: matched. The InvoiceID is the fingerprint of the details, and the sender, the deposit address and the rules agree.`);

  console.log('\nDone. Every step passed.');
} finally {
  await client.disconnect();
}
