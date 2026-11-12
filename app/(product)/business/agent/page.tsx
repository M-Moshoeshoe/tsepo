import type { Metadata } from 'next';
import { Button } from '@/components/base/buttons/button';
import { AgentMoreMenu, ChangeLimitsButton, RevokeButton } from '../../../../components/business/agent-actions.tsx';
import { AgentStatusBadge } from '../../../../components/business/agent-status.tsx';
import { Instructions } from '../../../../components/business/instructions.tsx';
import { PaymentPanel } from '../../../../components/business/payment-panel.tsx';
import { CopyableMono, ExplorerLink, Facts, SectionTitle } from '../../../../components/display.tsx';
import { Term } from '../../../../components/term.tsx';
import { findPayment, parsePaymentQuery, paymentsHref } from '../../../../src/views/payments.ts';
import { formatSast } from '../../../../src/views/status.ts';
import { loadRegistry, type RegistryView } from '../../../_data/registry.ts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Agent, Lesedi Design Studio - Tšepo' };

const PATH = '/business/agent';

function PageHeader({ view }: { view: RegistryView }) {
  const { agent, mandate } = view;
  const active = agent.status.state === 'active';
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="grid gap-1.5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold text-primary">{agent.name}</h2>
          <AgentStatusBadge status={agent.status} />
        </div>
        <p className="text-sm text-tertiary">
          Pays contractors for {view.business.registeredName}.
          {agent.status.state === 'revoked' &&
            `${agent.status.at === undefined ? ' Revoked.' : ` Revoked at ${formatSast(agent.status.at)}.`} Its credential is deleted, so it cannot pay. Use More to register it again.`}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {active && (
          <>
            <ChangeLimitsButton perPaymentLimit={mandate?.perPaymentLimit} dailyLimit={mandate?.dailyLimit} agentActive />
            <RevokeButton agentActive />
          </>
        )}
        <AgentMoreMenu agentActive={active} />
      </div>
    </div>
  );
}

/** One line on what the agent may do; the full rules live on Spending rules. */
function RulesSummary({ view }: { view: RegistryView }) {
  const { mandate, signers } = view;
  return (
    <section aria-labelledby="rules-title" className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-xl px-5 py-4 ring-1 ring-secondary ring-inset">
      <h2 id="rules-title" className="sr-only">
        Spending rules in brief
      </h2>
      <p className="text-sm text-secondary tabular-nums">
        {mandate === undefined
          ? 'This agent has no spending rules, so it cannot pay.'
          : `${mandate.usage.sentence}. Up to ${mandate.perPaymentLimit} RLUSD per payment.${signers === undefined ? '' : ' Each payment needs the agent and the approval service.'}`}
      </p>
      <Button href="/business/rules" color="link-color" size="md">
        Spending rules
      </Button>
    </section>
  );
}

function TechnicalDetails({ view }: { view: RegistryView }) {
  const { agent, business, mandate } = view;
  return (
    <details className="group rounded-xl ring-1 ring-secondary ring-inset">
      <summary className="cursor-pointer list-none rounded-xl px-5 py-4 text-sm font-semibold text-primary outline-focus-ring focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
        Technical details
        <span className="ml-2 font-normal text-tertiary">Accounts, credential and fingerprint on the XRP Ledger</span>
      </summary>
      <div className="px-5 pb-5">
        <Facts
          items={[
            { term: 'Works for', value: `${business.registeredName}, registration (CIPC) ${business.registrationNumber}` },
            { term: 'Agent account', value: <CopyableMono value={agent.address} label="agent ledger account" className="text-xs" /> },
            {
              key: 'credential',
              term: <Term term="credential">Credential</Term>,
              value:
                agent.credentialId === undefined ? (
                  <span className="text-tertiary">No credential on the ledger</span>
                ) : (
                  <span className="grid gap-1">
                    <span>Verified agent, issued by Tšepo</span>
                    <CopyableMono value={agent.credentialId} label="credential ID" className="text-xs text-tertiary" />
                    {agent.credentialHash !== undefined && <ExplorerLink hash={agent.credentialHash}>View on the XRP Ledger</ExplorerLink>}
                  </span>
                ),
            },
            ...(mandate === undefined
              ? []
              : [
                  {
                    key: 'fingerprint',
                    term: (
                      <>
                        Rules <Term term="fingerprint">fingerprint</Term>
                      </>
                    ),
                    value: <CopyableMono value={mandate.fingerprint} label="spending rules fingerprint" className="text-xs" />,
                  },
                ]),
          ]}
        />
      </div>
    </details>
  );
}

/** One agent: what it may do in one line, a way to instruct it, what it read and paid, and its ledger details. */
export default async function AgentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parsePaymentQuery(await searchParams);
  const view = await loadRegistry();
  const open = findPayment(view.instructions, query.payment);

  return (
    <div className="grid max-w-5xl gap-8">
      <PageHeader view={view} />
      <RulesSummary view={view} />
      <section aria-labelledby="instruct-link-title" className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-secondary px-5 py-4">
        <div className="grid gap-0.5">
          <h2 id="instruct-link-title" className="text-md font-semibold text-primary">
            Give the agent an instruction
          </h2>
          <p className="text-sm text-tertiary">Write what it should pay and see what the spending rules decide, live on Testnet.</p>
        </div>
        <Button href="/business/instruct" color="primary" size="md">
          Give an instruction
        </Button>
      </section>
      <section aria-labelledby="instructions-title" className="grid gap-4">
        <SectionTitle
          id="instructions-title"
          title="Instructions"
          aside={
            <Button href="/business/payments" color="link-color" size="md">
              All payments
            </Button>
          }
        />
        <p className="-mt-2 text-sm text-tertiary">The AI only reads each instruction. The approval service decides every payment, never the model.</p>
        <Instructions instructions={view.instructions} hrefFor={(id) => paymentsHref(PATH, { payment: id })} />
      </section>
      <TechnicalDetails view={view} />
      {open !== undefined && <PaymentPanel open={open} closeHref={PATH} />}
    </div>
  );
}
