import type { Metadata } from 'next';
import { Amount, CopyableMono, DemoDataTag, ExplorerLink, Facts, Section } from '../../components/display.tsx';
import { Term } from '../../components/term.tsx';
import { AgentActivity } from '../../components/registry/agent-activity.tsx';
import { MandateActions } from '../../components/registry/mandate-actions.tsx';
import { Badge } from '../../components/ui/badge.tsx';
import { toUnits } from '../../src/domain/amount.ts';
import { formatSast } from '../../src/views/status.ts';
import { loadRegistry, type AgentStatus, type RegistryView } from '../_data/registry.ts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Agent registry - Tšepo' };

function StatusBadge({ status }: { status: AgentStatus }) {
  switch (status.state) {
    case 'active':
      return <Badge tone="cleared">Active</Badge>;
    case 'revoked':
      return (
        <span className="flex flex-wrap items-center gap-2">
          <Badge tone="refused">Revoked</Badge>
          {status.at !== undefined && <span className="text-sm text-muted">at {formatSast(status.at)}</span>}
        </span>
      );
    case 'mismatch':
      return <Badge tone="held">Credential does not match the mandate</Badge>;
    case 'not-registered':
      return <Badge>Not registered</Badge>;
  }
}

function DailyUse({ used, limit }: { used: string; limit: string }) {
  const share = Math.min(100, Number((toUnits(used) * 100n) / toUnits(limit)));
  return (
    <div className="grid gap-1.5">
      <p>
        <Amount value={limit} /> <span className="text-muted">per day.</span>{' '}
        <span className="tabular-nums">
          {used} of {limit} RLUSD
        </span>{' '}
        <span className="text-muted">co-signed today (SAST)</span>
      </p>
      <div className="h-1.5 w-full max-w-64 rounded-md bg-background" role="img" aria-label={`${share} percent of the daily limit used`}>
        <div className="h-full rounded-md bg-primary" style={{ width: `${share}%` }} />
      </div>
    </div>
  );
}

function BusinessSection({ business }: { business: RegistryView['business'] }) {
  const { address } = business;
  return (
    <Section title="Business" aside={<DemoDataTag />}>
      <Facts
        items={[
          { term: 'Registered name', value: business.registeredName },
          { term: 'Registration number (CIPC)', value: <span className="tabular-nums">{business.registrationNumber}</span> },
          { term: 'Address', value: `${address.street}, ${address.city}, ${address.postalCode}, South Africa` },
          { term: 'Ledger account', value: <CopyableMono value={business.ledgerAddress} label="business ledger account" /> },
        ]}
      />
    </Section>
  );
}

function AgentSection({ agent }: { agent: RegistryView['agent'] }) {
  return (
    <Section title="Agent">
      <Facts
        items={[
          { term: 'Ledger account', value: <CopyableMono value={agent.address} label="agent ledger account" /> },
          { term: 'Status', value: <StatusBadge status={agent.status} /> },
          {
            key: 'credential',
            term: <Term term="credential">Credential</Term>,
            value:
              agent.credentialId === undefined ? (
                <span className="text-muted">No credential on the ledger</span>
              ) : (
                <span className="grid gap-1">
                  <span>AGENT_MANDATE</span>
                  <CopyableMono value={agent.credentialId} label="credential ID" className="text-xs text-muted" />
                  {agent.credentialHash !== undefined && <ExplorerLink hash={agent.credentialHash}>Acceptance on the ledger</ExplorerLink>}
                </span>
              ),
          },
          { term: 'Issued by', value: <CopyableMono value={agent.issuer} label="issuer account" /> },
        ]}
      />
    </Section>
  );
}

function MandateSection({ view }: { view: RegistryView }) {
  const { mandate } = view;
  if (mandate === undefined) {
    return (
      <Section title="Mandate">
        <p className="text-sm text-muted">No mandate is set. Reset the demo to register the agent.</p>
      </Section>
    );
  }
  return (
    <Section title="Mandate">
      <div className="grid gap-5">
        <Facts
          items={[
            {
              term: 'Approved recipients',
              value: (
                <ul className="grid gap-3">
                  {mandate.approvedRecipients.map((recipient) => (
                    <li key={`${recipient.address}-${String(recipient.destinationTag)}`} className="grid gap-0.5">
                      <span className="font-medium">{recipient.name}</span>
                      <span className="text-muted">
                        {recipient.paidThrough === undefined ? 'paid directly' : `paid through ${recipient.paidThrough}`}
                        {recipient.destinationTag !== undefined && <span className="tabular-nums"> (tag {recipient.destinationTag})</span>}
                      </span>
                      <CopyableMono value={recipient.address} label={`account for ${recipient.name}`} className="text-xs" />
                    </li>
                  ))}
                </ul>
              ),
            },
            { term: 'Per-payment limit', value: <Amount value={mandate.perPaymentLimit} /> },
            { term: 'Daily limit', value: <DailyUse used={mandate.usedToday} limit={mandate.dailyLimit} /> },
            { term: 'Expires', value: formatSast(mandate.expiresAt) },
            {
              key: 'fingerprint',
              term: <Term term="fingerprint">Fingerprint</Term>,
              value: <CopyableMono value={mandate.fingerprint} label="mandate fingerprint" className="text-xs" />,
            },
          ]}
        />
        <MandateActions
          perPaymentLimit={mandate.perPaymentLimit}
          dailyLimit={mandate.dailyLimit}
          agentActive={view.agent.status.state === 'active'}
        />
      </div>
    </Section>
  );
}

export default async function RegistryPage() {
  const view = await loadRegistry();
  return (
    <div className="grid gap-6">
      <h1 className="text-2xl font-semibold text-ink">Agent registry</h1>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="grid content-start gap-6">
          <BusinessSection business={view.business} />
          <AgentSection agent={view.agent} />
          <MandateSection view={view} />
        </div>
        <Section title="Agent activity" className="content-start self-start">
          <AgentActivity activity={view.activity} />
        </Section>
      </div>
    </div>
  );
}
