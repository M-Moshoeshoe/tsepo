import type { Metadata } from 'next';
import { Button } from '@/components/base/buttons/button';
import { ChangeLimitsButton, RegisterAgainButton, RevokeButton } from '../../../../components/business/agent-actions.tsx';
import { AgentStatusBadge } from '../../../../components/business/agent-status.tsx';
import { Instructions } from '../../../../components/business/instructions.tsx';
import { PaymentPanel } from '../../../../components/business/payment-panel.tsx';
import { TodayMeter } from '../../../../components/business/today-meter.tsx';
import { CopyableMono, ExplorerLink, Facts, SectionTitle } from '../../../../components/display.tsx';
import { Term } from '../../../../components/term.tsx';
import { findPayment, parsePaymentQuery, paymentsHref } from '../../../../src/views/payments.ts';
import { formatSast, formatSastDate } from '../../../../src/views/status.ts';
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
            `${agent.status.at === undefined ? ' Revoked.' : ` Revoked at ${formatSast(agent.status.at)}.`} Its credential is deleted, so it cannot pay.`}
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        {active ? (
          <>
            <ChangeLimitsButton perPaymentLimit={mandate?.perPaymentLimit} dailyLimit={mandate?.dailyLimit} agentActive />
            <RevokeButton agentActive />
          </>
        ) : (
          <RegisterAgainButton />
        )}
      </div>
    </div>
  );
}

function Summary({ view }: { view: RegistryView }) {
  const { mandate } = view;
  return (
    <section aria-labelledby="rules-title" className="grid gap-5 rounded-xl bg-secondary p-5 lg:p-6">
      <SectionTitle
        id="rules-title"
        title="Today"
        aside={
          <Button href="/business/rules" color="link-color" size="md">
            Spending rules
          </Button>
        }
      />
      {mandate === undefined ? (
        <p className="text-sm text-tertiary">This agent has no spending rules, so it cannot pay.</p>
      ) : (
        <>
          <TodayMeter usage={mandate.usage} perPaymentLimit={mandate.perPaymentLimit} totalsClearedAt={mandate.totalsClearedAt} />
          <p className="text-sm text-tertiary">
            {mandate.usage.sentence}. Spending rules expire on {formatSastDate(mandate.expiresAt)}.
          </p>
        </>
      )}
    </section>
  );
}

function Identity({ view }: { view: RegistryView }) {
  const { agent, business, mandate } = view;
  return (
    <section aria-labelledby="identity-title" className="grid content-start gap-4">
      <SectionTitle id="identity-title" title="Identity" />
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
      <p className="text-sm text-secondary">
        {view.signers === undefined
          ? 'No signer list is set on the ledger yet.'
          : `Each payment needs ${String(view.signers.quorum)} signatures: the agent and the approval service.`}{' '}
        <Button href="/business/rules#who-must-approve" color="link-color" size="sm">
          Who must approve each payment
        </Button>
      </p>
    </section>
  );
}

/** One agent: what it may spend today, what it read and paid, and who it is on the ledger. */
export default async function AgentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = parsePaymentQuery(await searchParams);
  const view = await loadRegistry();
  const open = findPayment(view.instructions, query.payment);

  return (
    <div className="grid gap-8">
      <PageHeader view={view} />
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 gap-10">
          <Summary view={view} />
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
        </div>
        <Identity view={view} />
      </div>
      {open !== undefined && <PaymentPanel open={open} closeHref={PATH} />}
    </div>
  );
}
