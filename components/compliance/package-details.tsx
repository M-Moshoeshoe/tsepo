import type { Directive9Package } from '../../src/domain/directive9.ts';
import { formatUtc } from '../../src/views/status.ts';
import { Amount, DemoDataTag, Facts, Mono } from '../display.tsx';

/** The travel information (FIC Directive 9) the exchange received before the payment. */
export function PackageDetails({ pkg }: { pkg: Directive9Package | undefined }) {
  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-ink">Directive 9 package</h3>
        <DemoDataTag />
      </div>
      {pkg === undefined ? (
        <p className="text-sm text-muted">No travel package was received for this payment.</p>
      ) : (
        <Facts
          items={[
            { term: 'Reference', value: <span className="tabular-nums">{pkg.reference}</span> },
            { term: 'Created', value: formatUtc(pkg.createdAt) },
            {
              term: 'Originator',
              value: (
                <span className="grid gap-0.5">
                  <span>{pkg.originator.registeredName}</span>
                  <span className="text-muted tabular-nums">Registration {pkg.originator.registrationNumber}</span>
                  <span className="text-muted">
                    {pkg.originator.address.street}, {pkg.originator.address.city}, {pkg.originator.address.postalCode},{' '}
                    {pkg.originator.address.country}
                  </span>
                  <Mono className="text-xs">{pkg.originator.ledgerAddress}</Mono>
                </span>
              ),
            },
            {
              term: 'Beneficiary',
              value: (
                <span className="grid gap-0.5">
                  <span>{pkg.beneficiary.name}</span>
                  <span className="text-muted tabular-nums">Destination tag {pkg.beneficiary.destinationTag}</span>
                  <Mono className="text-xs">{pkg.beneficiary.ledgerAddress}</Mono>
                </span>
              ),
            },
            { term: 'Amount', value: <Amount value={pkg.transfer.amount} /> },
            { term: 'Purpose', value: pkg.transfer.purpose },
            {
              term: 'Agent mandate',
              value: (
                <span className="grid gap-0.5">
                  <span className="tabular-nums">
                    {pkg.agent.mandate.perPaymentLimit} RLUSD per payment, {pkg.agent.mandate.dailyLimit} RLUSD per day
                  </span>
                  <span className="text-muted">Expires {formatUtc(pkg.agent.mandate.expiresAt)}</span>
                  <Mono className="text-xs">{pkg.agent.mandateFingerprint}</Mono>
                </span>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
