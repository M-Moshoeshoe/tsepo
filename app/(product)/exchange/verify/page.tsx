import type { Metadata } from 'next';
import { Button } from '@/components/base/buttons/button';
import { CopyableMono, ExplorerLink, Facts, StatusBadge } from '../../../../components/display.tsx';
import { Term } from '../../../../components/term.tsx';
import { formatSast } from '../../../../src/views/status.ts';
import { NOT_VERIFIED_TEXT, type VerifyStatus } from '../../../../src/views/verify.ts';
import { loadVerify } from '../../../_data/verify.ts';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Verify an agent, Receiving platform - Tšepo' };

const EVENT_LABELS = {
  CredentialCreate: 'Credential issued by Tšepo',
  CredentialAccept: 'Accepted by the agent',
  CredentialDelete: 'Deleted: the agent was revoked',
} as const;

function StatusLine({ status }: { status: VerifyStatus }) {
  switch (status.state) {
    case 'verified':
      return (
        <div className="grid justify-items-start gap-1">
          <StatusBadge tone="cleared" size="md">
            Verified
          </StatusBadge>
          <p className="text-sm text-secondary">
            This address holds an accepted Tšepo credential that has not expired. The agent deposit address accepts its payments.
          </p>
        </div>
      );
    case 'revoked':
      return (
        <div className="grid justify-items-start gap-1">
          <StatusBadge tone="refused" size="md">
            {status.at === undefined ? 'Revoked' : `Revoked on ${formatSast(status.at)}`}
          </StatusBadge>
          <p className="text-sm text-secondary">Its business deleted the credential. The agent deposit address rejects its payments.</p>
        </div>
      );
    case 'not-verified':
      return (
        <div className="grid justify-items-start gap-1">
          <StatusBadge tone="refused" size="md">
            Not verified
          </StatusBadge>
          <p className="text-sm text-secondary">{NOT_VERIFIED_TEXT[status.reason]}</p>
        </div>
      );
  }
}

/** Paste an address and see whether it is a verified agent, whose it is, and the credential's history, read from the ledger. */
export default async function VerifyPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const typed = typeof params.address === 'string' ? params.address : undefined;
  const view = await loadVerify(typed);
  const { result } = view;

  return (
    <div className="grid max-w-3xl gap-6">
      <p className="text-md text-secondary">
        Check any XRP Ledger address before or after it pays you. This reads the ledger only: the agent&apos;s{' '}
        <Term term="credential">Tšepo credential</Term>, who issued it, and its history.
      </p>

      <form action="/exchange/verify" method="get" className="grid gap-3 rounded-xl bg-secondary p-5">
        <label htmlFor="address" className="text-sm font-medium text-secondary">
          Agent address
        </label>
        <div className="flex flex-wrap gap-3">
          <input
            id="address"
            name="address"
            defaultValue={typed ?? ''}
            spellCheck={false}
            autoComplete="off"
            placeholder="r..."
            aria-invalid={result.kind === 'invalid'}
            aria-describedby={result.kind === 'invalid' ? 'address-error' : undefined}
            className="min-w-0 grow rounded-lg bg-primary px-3.5 py-2.5 font-mono text-sm text-primary shadow-xs ring-1 ring-primary outline-hidden ring-inset placeholder:text-placeholder focus:ring-2 focus:ring-brand aria-invalid:ring-error_subtle"
          />
          <Button type="submit" color="primary" size="md">
            Verify
          </Button>
        </div>
        {result.kind === 'invalid' && (
          <p id="address-error" role="alert" className="text-sm text-error-primary">
            That is not an XRP Ledger address. It starts with r and has 25 to 35 letters and numbers.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-tertiary">Try:</span>
          {view.examples.map((example) => (
            <Button key={example.address} href={`/exchange/verify?address=${example.address}`} color="secondary" size="sm">
              {example.label}
            </Button>
          ))}
        </div>
      </form>

      {result.kind === 'checked' && (
        <section aria-labelledby="verify-result" className="grid gap-5 rounded-xl p-5 ring-1 ring-secondary ring-inset">
          <h2 id="verify-result" className="sr-only">
            Result
          </h2>
          <StatusLine status={result.status} />
          <Facts
            items={[
              { term: 'Address', value: <CopyableMono value={result.address} label="agent address" className="text-xs" /> },
              {
                term: 'Works for',
                value:
                  result.business === undefined ? (
                    <span className="text-tertiary">Not known here. The business arrives with each payment&apos;s Travel Rule details.</span>
                  ) : (
                    `${result.business.name}, registration (CIPC) ${result.business.registration}. Agent: ${result.business.agentName}.`
                  ),
              },
              ...(result.credential === undefined
                ? []
                : [
                    { term: 'Credential', value: 'AGENT_MANDATE, issued by Tšepo' },
                    { term: 'Issuer', value: <CopyableMono value={view.issuer} label="Tšepo issuer account" className="text-xs" /> },
                    ...(result.status.state === 'verified' && result.status.expiresAt !== undefined
                      ? [{ term: 'Expires', value: formatSast(result.status.expiresAt) }]
                      : []),
                    ...(result.credential.entry.uri === undefined
                      ? []
                      : [
                          {
                            key: 'fingerprint',
                            term: (
                              <>
                                Rules <Term term="fingerprint">fingerprint</Term>
                              </>
                            ),
                            value: <CopyableMono value={result.credential.entry.uri} label="spending rules fingerprint" className="text-xs" />,
                          },
                        ]),
                  ]),
            ]}
          />
          {result.history.length > 0 && (
            <div className="grid gap-2">
              <h3 className="text-sm font-semibold text-primary">Credential history</h3>
              <ol className="grid gap-2">
                {result.history.slice(0, 10).map((event) => (
                  <li key={event.hash} className="flex flex-wrap items-center justify-between gap-2 border-t border-secondary pt-2 text-sm first:border-t-0 first:pt-0">
                    <span className="text-primary">
                      {EVENT_LABELS[event.type]}
                      {event.closeTimeIso !== undefined && <span className="text-tertiary">, {formatSast(event.closeTimeIso)}</span>}
                    </span>
                    <ExplorerLink hash={event.hash}>View on the XRP Ledger</ExplorerLink>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
