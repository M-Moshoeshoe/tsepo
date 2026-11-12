import type { Metadata } from 'next';
import { ChangeLimitsButton, RevokeButton } from '../../../../components/business/agent-actions.tsx';
import { AgentStatusBadge } from '../../../../components/business/agent-status.tsx';
import { RecipientsTable } from '../../../../components/business/recipients-table.tsx';
import { WhoMustApprove } from '../../../../components/business/who-must-approve.tsx';
import { Amount, CopyableMono, SectionTitle } from '../../../../components/display.tsx';
import { Term } from '../../../../components/term.tsx';
import { formatSastDate } from '../../../../src/views/status.ts';
import { loadRegistry, type RegistryView } from '../../../_data/registry.ts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Spending rules, Lesedi Design Studio - Tšepo' };

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-sm text-tertiary">{label}</dt>
      <dd className="text-display-xs font-semibold text-primary tabular-nums">{children}</dd>
    </div>
  );
}

function Limits({ view }: { view: RegistryView }) {
  const { mandate, agent } = view;
  const active = agent.status.state === 'active';
  if (mandate === undefined) {
    return (
      <section className="grid justify-items-start gap-3 rounded-xl bg-secondary p-5 lg:p-6">
        <SectionTitle title="Limits" />
        <p className="text-sm text-tertiary">This agent has no spending rules yet, so it cannot pay. You can register it again from the Agent page.</p>
      </section>
    );
  }
  return (
    <section aria-labelledby="limits-title" className="grid gap-6 rounded-xl bg-secondary p-5 lg:p-6">
      <SectionTitle
        id="limits-title"
        title="Limits"
        aside={<ChangeLimitsButton perPaymentLimit={mandate.perPaymentLimit} dailyLimit={mandate.dailyLimit} agentActive={active} />}
      />
      <dl className="grid gap-5 sm:grid-cols-3">
        <Figure label="Per payment">
          <Amount value={mandate.perPaymentLimit} />
        </Figure>
        <Figure label="Per day (SAST)">
          <Amount value={mandate.dailyLimit} />
        </Figure>
        <Figure label="Expires">{formatSastDate(mandate.expiresAt)}</Figure>
      </dl>
      <p className="max-w-3xl text-sm text-secondary">
        Your business key signs every change. The agent has no way to change these rules, and the approval service checks each
        payment against them before it signs.
      </p>
      <p className="flex flex-wrap items-center gap-x-2 text-sm text-tertiary">
        Rules <Term term="fingerprint">fingerprint</Term>
        <CopyableMono value={mandate.fingerprint} label="spending rules fingerprint" className="text-xs text-tertiary" />
      </p>
    </section>
  );
}

/** What the agent may do, who must approve each payment, and the controls to change or stop it. */
export default async function SpendingRulesPage() {
  const view = await loadRegistry();
  const { agent, mandate } = view;
  const active = agent.status.state === 'active';

  return (
    <div className="grid max-w-5xl gap-10">
      <p className="-mt-2 flex flex-wrap items-center gap-2 text-sm text-tertiary">
        The <Term term="spending-rules">spending rules</Term> for {agent.name} <AgentStatusBadge status={agent.status} />
      </p>

      <Limits view={view} />

      {mandate !== undefined && (
        <section aria-labelledby="recipients-title" className="grid gap-4">
          <SectionTitle id="recipients-title" title="Approved recipients" />
          <div className="overflow-hidden rounded-xl ring-1 ring-secondary">
            <RecipientsTable recipients={mandate.approvedRecipients} />
          </div>
          <p className="text-sm text-tertiary">Recipients are part of the signed rules. Any payment to anyone else is refused.</p>
        </section>
      )}

      <section id="who-must-approve" aria-labelledby="approve-title" className="grid scroll-mt-8 gap-4">
        <SectionTitle id="approve-title" title="Who must approve each payment" />
        <WhoMustApprove signers={view.signers} />
      </section>

      <section aria-labelledby="danger-title" className="grid gap-3 rounded-xl p-5 ring-1 ring-error_subtle ring-inset lg:p-6">
        <SectionTitle id="danger-title" title="Stop the agent" />
        <p className="max-w-3xl text-sm text-secondary">
          Revoking deletes the agent&apos;s credential from the ledger with your business key. From the next ledger, within seconds,
          the approval service refuses every payment it asks for, and exchanges reject it.
        </p>
        {active ? (
          <div>
            <RevokeButton agentActive />
          </div>
        ) : (
          <p className="text-sm text-tertiary">This agent is already revoked. You can register it again from the Agent page.</p>
        )}
      </section>
    </div>
  );
}
