import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { CopyableMono } from '../../../../components/display.tsx';
import { Term } from '../../../../components/term.tsx';
import { REPOSITORY } from '../../../../src/views/navigation.ts';
import { publicAddresses } from '../../../_data/addresses.ts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Integrate, Receiving exchange - Tšepo' };

function Code({ children, label }: { children: string; label: string }) {
  return (
    // Focusable, so keyboard users can scroll a long line sideways.
    <pre role="region" aria-label={label} tabIndex={0} className="overflow-x-auto rounded-lg bg-primary-solid p-4 text-xs leading-relaxed text-white outline-focus-ring focus-visible:outline-2">
      <code className="font-mono">{children}</code>
    </pre>
  );
}

function Step({ number, title, children }: { number: number; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`step-${String(number)}`} className="grid gap-3 border-t border-secondary pt-6">
      <h2 id={`step-${String(number)}`} className="flex items-center gap-3 text-lg font-semibold text-primary">
        <span className="flex size-7 items-center justify-center rounded-full bg-brand-solid text-sm text-white tabular-nums">{number}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

/** For exchanges: three steps to accept agent payments only from verified agents, with code from Tšepo's own tested implementation. */
export default function IntegratePage() {
  const { issuer, depositAddress } = publicAddresses();
  const source = (path: string): string => `${REPOSITORY}/blob/main/${path}`;

  return (
    <div className="grid max-w-3xl gap-6">
      <p className="text-md text-secondary">
        Accept agent payments only from agents that hold a valid Tšepo credential, and know who each agent works for before the money
        arrives. Three steps, on your own XRP Ledger account. The code below is taken from Tšepo&apos;s tested implementation, written
        with xrpl.js.
      </p>
      <dl className="grid gap-2 rounded-xl bg-secondary p-4 text-sm">
        <div className="flex flex-wrap items-center gap-x-3">
          <dt className="text-tertiary">Tšepo issuer on Testnet</dt>
          <dd>
            <CopyableMono value={issuer} label="Tšepo issuer account" className="text-xs" />
          </dd>
        </div>
        <div className="flex flex-wrap items-center gap-x-3">
          <dt className="text-tertiary">Credential type</dt>
          <dd className="font-mono text-xs text-primary">AGENT_MANDATE</dd>
        </div>
        <div className="flex flex-wrap items-center gap-x-3">
          <dt className="text-tertiary">This exchange&apos;s agent deposit address</dt>
          <dd>
            <CopyableMono value={depositAddress} label="agent deposit address" className="text-xs" />
          </dd>
        </div>
      </dl>

      <Step number={1} title="Turn on credential-based Deposit Authorization">
        <p className="text-sm text-secondary">
          Make one address your <Term term="agent-deposit-address">agent deposit address</Term>. With Deposit Authorization on, the XRP
          Ledger itself rejects any payment to it from a sender that does not present an accepted AGENT_MANDATE credential from the
          Tšepo issuer.
        </p>
        <Code label="Turn on Deposit Authorization and accept Tšepo credentials">{`import { AccountSetAsfFlags, convertStringToHex } from 'xrpl';

const TSEPO_ISSUER = '${issuer}';

// Only senders you preauthorise can pay this address.
await client.submitAndWait(
  { TransactionType: 'AccountSet', Account: depositAddress, SetFlag: AccountSetAsfFlags.asfDepositAuth },
  { wallet, autofill: true },
);

// Preauthorise any sender holding an accepted AGENT_MANDATE credential from Tšepo.
await client.submitAndWait(
  {
    TransactionType: 'DepositPreauth',
    Account: depositAddress,
    AuthorizeCredentials: [{ Credential: { Issuer: TSEPO_ISSUER, CredentialType: convertStringToHex('AGENT_MANDATE') } }],
  },
  { wallet, autofill: true },
);`}</Code>
        <p className="text-xs text-tertiary">
          Check that each result is tesSUCCESS. From{' '}
          <a href={source('spikes/agent-lane.ts')} target="_blank" rel="noreferrer" className="font-semibold text-brand-secondary">
            spikes/agent-lane.ts
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          .
        </p>
      </Step>

      <Step number={2} title="Check an agent's Tšepo credential">
        <p className="text-sm text-secondary">
          Before you credit a deposit, read the sender&apos;s credential from the validated ledger. It counts only when Tšepo issued it,
          the agent accepted it, and it has not expired. Its URI holds the fingerprint of the agent&apos;s spending rules.
        </p>
        <Code label="Check an agent's credential">{`import { convertHexToString, convertStringToHex, unixTimeToRippleTime } from 'xrpl';

const ACCEPTED = 0x00010000; // lsfAccepted

async function checkAgent(client, agentAddress) {
  const { result } = await client.request({
    command: 'account_objects',
    account: agentAddress,
    type: 'credential',
    ledger_index: 'validated',
  });
  const credential = result.account_objects.find(
    (entry) => entry.Issuer === TSEPO_ISSUER && entry.CredentialType === convertStringToHex('AGENT_MANDATE'),
  );
  if (credential === undefined) return { valid: false, reason: 'no Tšepo credential' };
  if ((credential.Flags & ACCEPTED) === 0) return { valid: false, reason: 'not accepted by the agent' };
  if (credential.Expiration === undefined || credential.Expiration <= unixTimeToRippleTime(Date.now())) {
    return { valid: false, reason: 'expired' };
  }
  return { valid: true, rulesFingerprint: convertHexToString(credential.URI) };
}`}</Code>
        <p className="text-xs text-tertiary">
          From{' '}
          <a href={source('src/ledger/reads.ts')} target="_blank" rel="noreferrer" className="font-semibold text-brand-secondary">
            src/ledger/reads.ts
            <span className="sr-only"> (opens in a new tab)</span>
          </a>{' '}
          and{' '}
          <a href={source('src/domain/credential-check.ts')} target="_blank" rel="noreferrer" className="font-semibold text-brand-secondary">
            src/domain/credential-check.ts
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          , covered by unit tests. You can also check any address on Verify an agent.
        </p>
      </Step>

      <Step number={3} title="Match the Travel Rule details by fingerprint">
        <p className="text-sm text-secondary">
          Before each payment, the agent sends you its <Term term="travel-rule">Travel Rule</Term> details (FIC Directive 9): originator,
          beneficiary, amount, purpose and its spending rules. The payment&apos;s InvoiceID is the SHA-256 fingerprint of those details,
          so you can match them exactly. Hold any payment whose details arrived late, never arrived, or do not match.
        </p>
        <Code label="Match a payment to its Travel Rule details">{`// details: the Travel Rule details the agent sent you before paying.
// fingerprint: SHA-256 of their canonical JSON, as "sha256:<hex>".
const expected = packageFingerprint(details).slice('sha256:'.length).toUpperCase();

const matches =
  payment.InvoiceID === expected &&
  payment.Destination === depositAddress &&
  payment.Account === details.agent.ledgerAddress &&
  details.agent.mandateFingerprint === rulesFingerprint; // from step 2

if (!matches || detailsArrivedAfter(payment)) holdForReview(payment);`}</Code>
        <p className="text-xs text-tertiary">
          The fingerprint and the checks are in{' '}
          <a href={source('src/domain/fingerprint.ts')} target="_blank" rel="noreferrer" className="font-semibold text-brand-secondary">
            src/domain/fingerprint.ts
            <span className="sr-only"> (opens in a new tab)</span>
          </a>{' '}
          and{' '}
          <a href={source('src/domain/deposit-assessment.ts')} target="_blank" rel="noreferrer" className="font-semibold text-brand-secondary">
            src/domain/deposit-assessment.ts
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          , with unit tests.
        </p>
      </Step>
    </div>
  );
}
