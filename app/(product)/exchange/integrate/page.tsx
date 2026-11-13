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
    <pre role="region" aria-label={label} tabIndex={0} className="overflow-x-auto rounded-xl bg-primary-solid p-5 text-xs leading-relaxed text-white outline-focus-ring focus-visible:outline-2">
      <code className="font-mono">{children}</code>
    </pre>
  );
}

function Step({ number, title, text, code, source }: { number: number; title: string; text: ReactNode; code: ReactNode; source: ReactNode }) {
  return (
    <section aria-labelledby={`step-${String(number)}`} className="grid gap-5 border-t border-secondary pt-8 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:gap-10">
      <div className="grid content-start gap-3">
        <p className="font-mono text-xs text-tertiary">Step {number} of 3</p>
        <h2 id={`step-${String(number)}`} className="text-xl font-medium text-primary">
          {title}
        </h2>
        <div className="text-md text-secondary">{text}</div>
        <div className="text-sm text-tertiary">{source}</div>
      </div>
      <div className="min-w-0">{code}</div>
    </section>
  );
}

/** For exchanges: three steps to accept agent payments only from verified agents, with code from Tšepo's own tested implementation. */
export default function IntegratePage() {
  const { issuer, depositAddress } = publicAddresses();
  const source = (path: string): string => `${REPOSITORY}/blob/main/${path}`;
  const link = (path: string): ReactNode => (
    <a href={source(path)} target="_blank" rel="noreferrer" className="font-mono text-xs font-semibold text-brand-secondary hover:text-brand-secondary_hover">
      {path}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );

  return (
    <div className="grid gap-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        <div className="grid content-start gap-3 text-md text-secondary">
          <p>Accept agent payments only from agents that hold a valid Tšepo credential, and know who each agent works for before the money arrives.</p>
          <p>The three steps below run on your own XRP Ledger account. The code comes from Tšepo’s tested implementation, written with xrpl.js.</p>
        </div>
        <dl className="grid content-start gap-3 rounded-2xl bg-secondary p-5 text-sm">
          <div className="grid gap-1">
            <dt className="text-tertiary">Tšepo issuer on Testnet</dt>
            <dd>
              <CopyableMono value={issuer} label="Tšepo issuer account" className="text-xs" />
            </dd>
          </div>
          <div className="grid gap-1 border-t border-secondary pt-3">
            <dt className="text-tertiary">Credential type</dt>
            <dd className="font-mono text-xs text-primary">AGENT_MANDATE</dd>
          </div>
          <div className="grid gap-1 border-t border-secondary pt-3">
            <dt className="text-tertiary">This exchange’s agent deposit address</dt>
            <dd>
              <CopyableMono value={depositAddress} label="agent deposit address" className="text-xs" />
            </dd>
          </div>
        </dl>
      </div>

      <Step
        number={1}
        title="Turn on credential-based Deposit Authorization."
        text={
          <p>
            Make one address your <Term term="agent-deposit-address">agent deposit address</Term>. With Deposit Authorization on, the XRP
            Ledger itself rejects any payment to it from a sender that does not present an accepted AGENT_MANDATE credential from Tšepo.
          </p>
        }
        source={<p>Check that each result is tesSUCCESS. The code comes from {link('spikes/agent-lane.ts')}.</p>}
        code={<Code label="Turn on Deposit Authorization and accept Tšepo credentials">{`import { AccountSetAsfFlags, convertStringToHex } from 'xrpl';

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
);`}</Code>}
      />

      <Step
        number={2}
        title="Check the agent’s Tšepo credential."
        text={
          <p>
            Before you credit a deposit, read the sender’s credential from the validated ledger. It counts only when Tšepo issued it, the
            agent accepted it and it has not expired. Its URI holds the fingerprint of the agent’s spending rules.
          </p>
        }
        source={
          <p>
            The code comes from {link('src/ledger/reads.ts')} and {link('src/domain/credential-check.ts')}, and unit tests cover it. You can
            also check any address on Verify an agent.
          </p>
        }
        code={<Code label="Check an agent's credential">{`import { convertHexToString, convertStringToHex, unixTimeToRippleTime } from 'xrpl';

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
}`}</Code>}
      />

      <Step
        number={3}
        title="Match the Travel Rule details by fingerprint."
        text={
          <p>
            Before each payment, the agent sends you its <Term term="travel-rule">Travel Rule</Term> details under FIC Directive 9: the
            originator, the beneficiary, the amount, the purpose and its spending rules. The payment’s InvoiceID is the SHA-256 fingerprint
            of those details, so you can match them exactly. Hold any payment whose details arrived late, never arrived or do not match.
          </p>
        }
        source={
          <p>
            The fingerprint and the checks are in {link('src/domain/fingerprint.ts')} and {link('src/domain/deposit-assessment.ts')}, with
            unit tests.
          </p>
        }
        code={<Code label="Match a payment to its Travel Rule details">{`// details: the Travel Rule details the agent sent you before paying.
// fingerprint: SHA-256 of their canonical JSON, as "sha256:<hex>".
const expected = packageFingerprint(details).slice('sha256:'.length).toUpperCase();

const matches =
  payment.InvoiceID === expected &&
  payment.Destination === depositAddress &&
  payment.Account === details.agent.ledgerAddress &&
  details.agent.mandateFingerprint === rulesFingerprint; // from step 2

if (!matches || detailsArrivedAfter(payment)) holdForReview(payment);`}</Code>}
      />
    </div>
  );
}
