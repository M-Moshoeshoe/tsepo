import { Building07, Key01, ShieldTick } from '@untitledui/icons';
import type { FC } from 'react';
import type { RegistryView } from '../../app/_data/registry.ts';
import { ShortAddress } from '../display.tsx';
import { Term } from '../term.tsx';

const ROLE: Record<string, { icon: FC<{ className?: string }>; note: string }> = {
  'Agent key': { icon: Key01, note: 'Held by the agent. It signs every payment it asks for.' },
  'Approval service': { icon: ShieldTick, note: 'Independent. It signs only within the spending rules.' },
  'Business key (recovery)': { icon: Building07, note: 'Held by your business. It can act alone, for recovery.' },
};

/**
 * The signer list in plain words: the agent can never pay alone. Read from the
 * ledger, so it shows what the XRP Ledger itself enforces.
 */
export function WhoMustApprove({ signers }: { signers: RegistryView['signers'] }) {
  if (signers === undefined) {
    return <p className="text-sm text-tertiary">No signer list on the ledger. Restore the sample data from the guided tour to set it up.</p>;
  }
  return (
    <div className="grid gap-4">
      <ul className="grid gap-3 sm:grid-cols-3" aria-label="Keys that can approve payments from the agent account">
        {signers.entries.map((signer) => {
          const role = ROLE[signer.role];
          const Icon = role?.icon ?? Key01;
          return (
            <li key={signer.address} className="grid content-start gap-2 rounded-xl p-4 ring-1 ring-secondary ring-inset">
              <span className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <Icon className="size-4 text-fg-brand-primary" aria-hidden />
                  {signer.role}
                </span>
                <span className="text-xs text-tertiary tabular-nums">Weight {signer.weight}</span>
              </span>
              {role !== undefined && <span className="text-sm text-tertiary">{role.note}</span>}
              <ShortAddress address={signer.address} className="text-xs" />
            </li>
          );
        })}
      </ul>
      <p className="text-sm font-semibold text-primary tabular-nums">
        <Term term="signatures-needed">Signatures needed</Term>: {signers.quorum}
      </p>
      <p className="max-w-3xl text-sm text-secondary">
        {signers.masterKeyDisabled
          ? "Your agent can never pay alone. Every payment needs the agent key and the approval service's key, and the approval service signs only within these rules. Your business key can act alone, for recovery. The account's original key is switched off."
          : "The account's original key is still on, so the agent account is not yet protected. Restore the sample data from the guided tour to switch it off."}
      </p>
    </div>
  );
}
