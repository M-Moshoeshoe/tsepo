import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { CopyableMono } from '../../../../components/display.tsx';
import { Term } from '../../../../components/term.tsx';
import { EXAMPLE_COMMAND, EXAMPLE_OUTPUT } from '../../../../src/views/integration.ts';
import { REPOSITORY } from '../../../../src/views/navigation.ts';
import { publicAddresses } from '../../../_data/addresses.ts';
import { integrationCode } from '../../../_data/integration.ts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Integrate, Receiving exchange - Tšepo' };

const EXAMPLE_PATH = 'examples/exchange-integration.ts';
const SAMPLE_PATH = 'examples/sample-travel-rule-details.json';

function Code({ children, label }: { children: string; label: string }) {
  return (
    // Focusable, so keyboard users can scroll a long line sideways.
    <pre role="region" aria-label={label} tabIndex={0} className="overflow-x-auto rounded-xl bg-primary-solid p-5 text-xs leading-relaxed text-white outline-focus-ring focus-visible:outline-2">
      <code className="font-mono">{children}</code>
    </pre>
  );
}

function Step({ label, id, title, text, code }: { label: string; id: string; title: string; text: ReactNode; code: ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid gap-5 border-t border-secondary pt-8 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:gap-10">
      <div className="grid content-start gap-3 text-md text-secondary">
        <p className="font-mono text-xs text-tertiary">{label}</p>
        <h2 id={id} className="text-xl font-medium text-primary">
          {title}
        </h2>
        {text}
      </div>
      <div className="grid min-w-0 content-start gap-4">{code}</div>
    </section>
  );
}

function FileLink({ path }: { path: string }) {
  return (
    <a href={`${REPOSITORY}/blob/main/${path}`} target="_blank" rel="noreferrer" className="font-mono text-sm font-semibold text-brand-secondary hover:text-brand-secondary_hover">
      {path}
      <span className="sr-only"> (opens in a new tab)</span>
    </a>
  );
}

/**
 * For exchanges: accept agent payments only from verified agents, in three
 * steps. The code is cut from examples/exchange-integration.ts, which runs
 * every step on Testnet, so the page and the script never differ.
 */
export default function IntegratePage() {
  const { issuer, depositAddress } = publicAddresses();
  const code = integrationCode();

  return (
    <div className="grid gap-8">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
        <div className="grid content-start gap-3 text-md text-secondary">
          <p>
            Tšepo lets your exchange accept payments from AI agents and know who each agent works for. Every Tšepo agent holds a
            credential on the XRP Ledger, issued by Tšepo, that proves its spending rules.
          </p>
          <p>
            In three steps on your own XRP Ledger account, you set up a deposit address that accepts only those agents. Each step below
            shows the code of a script that runs it on Testnet.
          </p>
          <p>You need Node.js 24 with the xrpl and zod packages. The script creates a Testnet account for you from the faucet.</p>
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
            <dt className="text-tertiary">The sample exchange’s agent deposit address</dt>
            <dd>
              <CopyableMono value={depositAddress} label="sample agent deposit address" className="text-xs" />
            </dd>
          </div>
        </dl>
      </div>

      <section aria-labelledby="try-it" className="grid gap-4 rounded-2xl p-5 ring-1 ring-secondary md:p-6 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:gap-10">
        <div className="grid content-start gap-3 text-md text-secondary">
          <h2 id="try-it" className="text-xl font-medium text-primary">
            Try it yourself.
          </h2>
          <p>
            Clone the repository, run <code className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-sm text-primary">npm install</code>, then
            run the command below. It needs no keys of yours and no access code.
          </p>
          <p>
            The script is <FileLink path={EXAMPLE_PATH} />. It makes its keys in memory, prints only addresses, hashes and results, and
            stops at any result other than tesSUCCESS. Your output looks like this, with different addresses and hashes.
          </p>
        </div>
        <div className="grid min-w-0 content-start gap-3">
          <Code label="The command that runs the example">{EXAMPLE_COMMAND}</Code>
          <Code label="What the example prints">{EXAMPLE_OUTPUT}</Code>
        </div>
      </section>

      <Step
        label="Before you start"
        id="setup"
        title="Name Tšepo, and submit every transaction safely."
        text={
          <>
            <p>The first two lines name the Tšepo issuer and the credential type. Your exchange trusts credentials from this issuer only.</p>
            <p>
              Every transaction goes through one function. It signs locally, lets autofill set the fee and sequence, records the hash
              before it submits, and stops at any result other than tesSUCCESS. Never retry a failed result blindly.
            </p>
          </>
        }
        code={
          <>
            <Code label="The Tšepo issuer and credential type">{code.constants}</Code>
            <Code label="Submit a transaction safely">{code.submit}</Code>
          </>
        }
      />

      <Step
        label="Step 1 of 3"
        id="step-1"
        title="Accept payments only from Tšepo agents."
        text={
          <>
            <p>
              Make one address your <Term term="agent-deposit-address">agent deposit address</Term> and turn on Deposit Authorization
              for it. The XRP Ledger then rejects every payment to it, except from senders that present an accepted AGENT_MANDATE
              credential from Tšepo.
            </p>
            <p>
              The script then checks it: a new account with no credential sends 1 XRP to the deposit address. The ledger itself rejects
              the payment with tecNO_PERMISSION, so it never reaches your account.
            </p>
          </>
        }
        code={
          <>
            <Code label="Turn on Deposit Authorization and accept Tšepo credentials">{code['step-1']}</Code>
            <Code label="Check that a sender without a credential is rejected">{code['step-1-check']}</Code>
          </>
        }
      />

      <Step
        label="Step 2 of 3"
        id="step-2"
        title="Check the agent’s Tšepo credential."
        text={
          <>
            <p>
              Before you credit a deposit, read the sender’s credential from the validated ledger. It is Verified only when Tšepo issued
              it, the agent accepted it and it has not expired.
            </p>
            <p>
              Its URI holds the fingerprint of the agent’s spending rules, never personal data. Keep the fingerprint for step 3. In the
              script, Lesedi’s agent is Verified and a new account is Not verified. You can also check any address on Verify an agent.
            </p>
          </>
        }
        code={<Code label="Check an agent’s credential">{code['step-2']}</Code>}
      />

      <Step
        label="Step 3 of 3"
        id="step-3"
        title="Match each payment to its Travel Rule details."
        text={
          <>
            <p>
              Before each payment, the agent sends you its <Term term="travel-rule">Travel Rule</Term> details off the ledger, as FIC
              Directive 9 requires: the originator, the beneficiary, the amount, the purpose and the agent’s spending rules.
            </p>
            <p>
              The payment’s InvoiceID is the SHA-256 fingerprint of those details in canonical JSON, so you can match them exactly. In
              this sandbox, the sample exchange receives the details inside Tšepo, and the script reads a real set from{' '}
              <FileLink path={SAMPLE_PATH} />.
            </p>
          </>
        }
        code={<Code label="Match a payment to its Travel Rule details">{code['step-3']}</Code>}
      />

      <section aria-labelledby="results" className="grid gap-4 border-t border-secondary pt-8 xl:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] xl:gap-10">
        <h2 id="results" className="text-xl font-medium text-primary">
          What to do with each result.
        </h2>
        <ul className="grid gap-3 text-md text-secondary">
          <li>When the agent is Verified and the payment matches its details, credit the deposit.</li>
          <li>When the agent is Not verified, or any match check fails, hold the deposit for review and do not credit it.</li>
          <li>When the details arrived after the payment, or never arrived, hold the deposit for review as well.</li>
          <li>A payment the ledger rejected never reaches your account, so there is nothing to credit or return.</li>
        </ul>
      </section>
    </div>
  );
}
