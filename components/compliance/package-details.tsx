import type { Directive9Package } from '../../src/domain/directive9.ts';
import { formatSast } from '../../src/views/status.ts';
import { TRAVEL_RULE_LABELS, TRAVEL_RULE_TONES, type TravelRuleTiming } from '../../src/views/travel-rule.ts';
import { Amount, CopyableMono, Facts, StatusBadge } from '../display.tsx';
import { Term } from '../term.tsx';

/** The travel information (FIC Directive 9) the exchange received before the payment. */
export function PackageDetails({ pkg, timing }: { pkg: Directive9Package | undefined; timing: TravelRuleTiming }) {
  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-primary">
          <Term term="travel-rule">Travel Rule</Term> details (FIC Directive 9)
        </h3>
      </div>
      <div>
        <span data-tour-target="travel-rule" className="inline-flex rounded-full">
          <StatusBadge tone={TRAVEL_RULE_TONES[timing]}>{TRAVEL_RULE_LABELS[timing]}</StatusBadge>
        </span>
      </div>
      {pkg === undefined ? (
        <p className="text-sm text-tertiary">No Travel Rule details were received for this payment.</p>
      ) : (
        <Facts
          items={[
            { term: 'Reference', value: <span className="tabular-nums">{pkg.reference}</span> },
            { term: 'Created', value: formatSast(pkg.createdAt) },
            {
              term: 'Originator',
              value: (
                <span className="grid gap-0.5">
                  <span>{pkg.originator.registeredName}</span>
                  <span className="text-tertiary tabular-nums">Registration {pkg.originator.registrationNumber}</span>
                  <span className="text-tertiary">
                    {pkg.originator.address.street}, {pkg.originator.address.city}, {pkg.originator.address.postalCode},{' '}
                    {pkg.originator.address.country}
                  </span>
                  <CopyableMono value={pkg.originator.ledgerAddress} label="originator account" className="text-xs" />
                </span>
              ),
            },
            {
              term: 'Beneficiary',
              value: (
                <span className="grid gap-0.5">
                  <span>{pkg.beneficiary.name}</span>
                  <span className="text-tertiary tabular-nums">Destination tag {pkg.beneficiary.destinationTag}</span>
                  <CopyableMono value={pkg.beneficiary.ledgerAddress} label="beneficiary account" className="text-xs" />
                </span>
              ),
            },
            { term: 'Amount', value: <Amount value={pkg.transfer.amount} /> },
            { term: 'Purpose', value: pkg.transfer.purpose },
            {
              term: 'Spending rules',
              value: (
                <span className="grid gap-0.5">
                  <span className="tabular-nums">
                    {pkg.agent.mandate.perPaymentLimit} RLUSD per payment, {pkg.agent.mandate.dailyLimit} RLUSD per day
                  </span>
                  <span className="text-tertiary">Expires {formatSast(pkg.agent.mandate.expiresAt)}</span>
                  <CopyableMono value={pkg.agent.mandateFingerprint} label="spending rules fingerprint" className="text-xs" />
                </span>
              ),
            },
          ]}
        />
      )}
    </section>
  );
}
