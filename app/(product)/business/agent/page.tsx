import type { Metadata } from 'next';
import { ProgressBarBase } from '@/components/base/progress-indicators/progress-indicators';
import { Amount, CopyableMono, ExplorerLink, Facts, SampleDataTag, SectionTitle, StatusBadge } from '../../../../components/display.tsx';
import { AgentActivity } from '../../../../components/registry/agent-activity.tsx';
import { MandateActions } from '../../../../components/registry/mandate-actions.tsx';
import { RecipientsTable } from '../../../../components/registry/recipients-table.tsx';
import { Term } from '../../../../components/term.tsx';
import { formatSast, formatSastDate } from '../../../../src/views/status.ts';
import { loadRegistry, type AgentStatus, type RegistryView } from '../../../_data/registry.ts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Agent, Lesedi Design Studio - Tšepo' };

function AgentStatusBadge({ status }: { status: AgentStatus }) {
  switch (status.state) {
    case 'active':
      return <StatusBadge tone="cleared">Active</StatusBadge>;
    case 'revoked':
      return <StatusBadge tone="refused">Revoked</StatusBadge>;
    case 'mismatch':
      return <StatusBadge tone="held">Credential does not match the spending rules</StatusBadge>;
    case 'not-registered':
      return <StatusBadge tone="neutral">Not registered</StatusBadge>;
  }
}

function PageHeader({ view }: { view: RegistryView }) {
  const { agent, mandate } = view;
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
            `${agent.status.at === undefined ? ' Revoked.' : ` Revoked at ${formatSast(agent.status.at)}.`} Its credential is deleted, so it cannot pay. Restore the sample data from the guided tour to register it again.`}
        </p>
      </div>
      <MandateActions
        perPaymentLimit={mandate?.perPaymentLimit}
        dailyLimit={mandate?.dailyLimit}
        agentActive={agent.status.state === 'active'}
      />
    </div>
  );
}

function Figure({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1">
      <dt className="text-sm text-tertiary">{label}</dt>
      <dd className="text-display-xs font-semibold text-primary tabular-nums">{children}</dd>
    </div>
  );
}

function MandateCard({ mandate }: { mandate: NonNullable<RegistryView['mandate']> }) {
  const { usage } = mandate;
  return (
    <section aria-labelledby="rules-title" className="grid gap-6 rounded-xl bg-secondary p-5 lg:p-6">
      <SectionTitle id="rules-title" title="Spending rules" />
      <dl className="grid gap-5 sm:grid-cols-3">
        <Figure label="Per payment">
          <Amount value={mandate.perPaymentLimit} />
        </Figure>
        <Figure label="Per day (SAST)">
          <Amount value={mandate.dailyLimit} />
        </Figure>
        <Figure label="Expires">{formatSastDate(mandate.expiresAt)}</Figure>
      </dl>
      <div className="grid gap-2">
        <p className="text-sm text-primary tabular-nums">{usage.sentence}</p>
        <ProgressBarBase value={usage.percent} label="Share of the daily limit used today" className="h-2 bg-tertiary" />
      </div>
      <p className="flex flex-wrap items-center gap-x-2 text-sm text-tertiary">
        Spending rules <Term term="fingerprint">fingerprint</Term>
        <CopyableMono value={mandate.fingerprint} label="spending rules fingerprint" className="text-xs text-tertiary" />
      </p>
    </section>
  );
}

function SideSection({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="grid content-start gap-4">
      <SectionTitle title={title} aside={aside} />
      {children}
    </section>
  );
}

function BusinessDetails({ business }: { business: RegistryView['business'] }) {
  const { address } = business;
  return (
    <SideSection title="Business" aside={<SampleDataTag />}>
      <Facts
        items={[
          { term: 'Registered name', value: business.registeredName },
          { term: 'Registration (CIPC)', value: <span className="tabular-nums">{business.registrationNumber}</span> },
          { term: 'Address', value: `${address.street}, ${address.city}, ${address.postalCode}, South Africa` },
          { term: 'Ledger account', value: <CopyableMono value={business.ledgerAddress} label="business ledger account" className="text-xs" /> },
        ]}
      />
    </SideSection>
  );
}

function CredentialDetails({ agent }: { agent: RegistryView['agent'] }) {
  return (
    <SideSection title="Identity">
      <Facts
        items={[
          { term: 'Agent account', value: <CopyableMono value={agent.address} label="agent ledger account" className="text-xs" /> },
          {
            key: 'credential',
            term: <Term term="credential">Credential</Term>,
            value:
              agent.credentialId === undefined ? (
                <span className="text-tertiary">No credential on the ledger</span>
              ) : (
                <span className="grid gap-1">
                  <span>AGENT_MANDATE</span>
                  <CopyableMono value={agent.credentialId} label="credential ID" className="text-xs text-tertiary" />
                  {agent.credentialHash !== undefined && <ExplorerLink hash={agent.credentialHash}>Acceptance on the ledger</ExplorerLink>}
                </span>
              ),
          },
          { term: 'Issued by', value: <span className="grid gap-0.5"><span>Tšepo</span><CopyableMono value={agent.issuer} label="Tšepo issuer account" className="text-xs text-tertiary" /></span> },
        ]}
      />
    </SideSection>
  );
}

function SignerSetup({ signers }: { signers: RegistryView['signers'] }) {
  return (
    <SideSection title="Who must approve each payment">
      {signers === undefined ? (
        <p className="text-sm text-tertiary">No signer list on the ledger. Restore the sample data from the guided tour to set it up.</p>
      ) : (
        <div className="grid gap-3">
          <table className="w-full text-sm">
            <caption className="sr-only">Keys that can approve payments from the agent account, with their weights</caption>
            <thead>
              <tr className="text-left text-xs font-semibold text-quaternary">
                <th scope="col" className="pb-2 font-semibold">
                  Key
                </th>
                <th scope="col" className="pb-2 text-right font-semibold">
                  Weight
                </th>
              </tr>
            </thead>
            <tbody>
              {signers.entries.map((signer) => (
                <tr key={signer.address} className="border-t border-secondary">
                  <th scope="row" className="py-2 text-left font-normal">
                    <span className="grid">
                      <span className="text-primary">{signer.role}</span>
                      <CopyableMono value={signer.address} label={`${signer.role} account`} className="text-xs text-tertiary" />
                    </span>
                  </th>
                  <td className="py-2 text-right align-top text-primary tabular-nums">{signer.weight}</td>
                </tr>
              ))}
              <tr className="border-t border-secondary">
                <th scope="row" className="py-2 text-left font-semibold text-primary">
                  <Term term="signatures-needed">Signatures needed</Term>
                </th>
                <td className="py-2 text-right font-semibold text-primary tabular-nums">{signers.quorum}</td>
              </tr>
            </tbody>
          </table>
          <p className="text-sm text-tertiary">
            {signers.masterKeyDisabled
              ? "Your agent can never pay alone. Every payment needs the agent key and the approval service together. The account's original key is switched off."
              : "The account's original key is still on. Restore the sample data from the guided tour to switch it off."}
          </p>
        </div>
      )}
    </SideSection>
  );
}

export default async function AgentPage() {
  const view = await loadRegistry();
  const { mandate } = view;
  return (
    <div className="grid gap-8">
      <PageHeader view={view} />
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="grid min-w-0 gap-10">
          {mandate === undefined ? (
            <section className="grid gap-2 rounded-xl bg-secondary p-6">
              <SectionTitle title="Spending rules" />
              <p className="text-sm text-tertiary">
                This agent has no spending rules, so it cannot pay. Restore the sample data from the guided tour to register it again.
              </p>
            </section>
          ) : (
            <MandateCard mandate={mandate} />
          )}
          {mandate !== undefined && (
            <section aria-labelledby="recipients-title" className="grid gap-4">
              <SectionTitle id="recipients-title" title="Approved recipients" />
              <div className="overflow-hidden rounded-xl ring-1 ring-secondary">
                <RecipientsTable recipients={mandate.approvedRecipients} />
              </div>
            </section>
          )}
          <section aria-labelledby="activity-title" className="grid gap-4">
            <SectionTitle id="activity-title" title="Activity" />
            <AgentActivity activity={view.activity} />
          </section>
        </div>
        <aside aria-label="Business, identity and approvals" className="grid gap-10">
          <BusinessDetails business={view.business} />
          <CredentialDetails agent={view.agent} />
          <SignerSetup signers={view.signers} />
        </aside>
      </div>
    </div>
  );
}
