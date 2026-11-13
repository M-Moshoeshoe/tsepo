import { Check, XClose } from '@untitledui/icons';
import type { ReactNode } from 'react';
import { DEMO_LIMITS } from '../../../src/config/demo.ts';
import { LANDING_ACTIONS } from '../../../src/views/navigation.ts';
import { shortHash, type ProofFile } from '../../../src/views/proof.ts';
import { StatusBadge } from '../../display.tsx';
import { SiteButton } from '../site-button.tsx';
import { SITE_WIDTH } from '../site-chrome.tsx';
import { UiCard } from '../section.tsx';
import { MomentSequence } from './moment-sequence.tsx';

const [tour, product] = LANDING_ACTIONS;

/** The two ways in, the tour first. */
export function LandingActions() {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      {tour !== undefined && (
        <SiteButton href={tour.href} tone="primary" size="lg">
          {tour.label}
        </SiteButton>
      )}
      {product !== undefined && (
        <SiteButton href={product.href} tone="secondary" size="lg">
          {product.label}
        </SiteButton>
      )}
    </div>
  );
}

function CheckRow({ passed, children }: { passed: boolean; children: ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm text-secondary">
      <span
        aria-hidden
        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full ${passed ? 'bg-success-solid' : 'bg-error-solid'} text-white`}
      >
        {passed ? <Check className="size-3" /> : <XClose className="size-3" />}
      </span>
      <span>
        <span className="sr-only">{passed ? 'Passed: ' : 'Failed: '}</span>
        {children}
      </span>
    </li>
  );
}

function MomentHead({ reference, title, badge }: { reference: string; title: string; badge: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="grid gap-0.5">
        <p className="font-mono text-xs text-tertiary">{reference}</p>
        <p className="text-sm font-semibold text-primary">{title}</p>
      </div>
      {badge}
    </div>
  );
}

function LedgerLine({ result, hash }: { result: string; hash: string }) {
  return (
    <p className="flex flex-wrap gap-x-3 border-t border-secondary pt-2.5 font-mono text-xs text-tertiary">
      <span className="text-primary">{result}</span>
      <span>{shortHash(hash)}</span>
    </p>
  );
}

/** The four moments of the tour, as the product shows them, with the real ledger results. */
function Moments({ proof }: { proof: ProofFile }) {
  return (
    <MomentSequence labels={['A payment approved and accepted', 'A split payment refused', 'An unknown agent rejected', 'An agent revoked']}>
      <UiCard label="A payment approved and accepted" className="h-full">
        <MomentHead reference="TOUR-1042" title="2 RLUSD to Naledi Mokoena" badge={<StatusBadge tone="cleared">Accepted</StatusBadge>} />
        <ul className="grid gap-1.5">
          <CheckRow passed>The agent holds a valid credential.</CheckRow>
          <CheckRow passed>The payment is within the spending rules.</CheckRow>
          <CheckRow passed>The Travel Rule details arrived first.</CheckRow>
        </ul>
        <LedgerLine result={proof.ledger['approved-payment'].result} hash={proof.transactions['approved-payment']} />
      </UiCard>
      <UiCard label="A split payment refused" className="h-full">
        <MomentHead reference="TOUR-2001-C" title="2 RLUSD to Thabo Nkosi, part 3 of 3" badge={<StatusBadge tone="refused">Not approved</StatusBadge>} />
        <ul className="grid gap-1.5">
          <CheckRow passed>The agent holds a valid credential.</CheckRow>
          <CheckRow passed={false}>Parts 1 to 3 add up to 6 RLUSD, over the {DEMO_LIMITS.dailyLimit} RLUSD daily limit.</CheckRow>
        </ul>
        <p className="border-t border-secondary pt-2.5 text-xs text-tertiary">The approval service decided. Nothing was sent.</p>
      </UiCard>
      <UiCard label="An unknown agent rejected" className="h-full">
        <MomentHead reference="Unregistered agent" title="2 RLUSD sent to the exchange" badge={<StatusBadge tone="refused">Rejected</StatusBadge>} />
        <ul className="grid gap-1.5">
          <CheckRow passed={false}>The agent has no Tšepo credential.</CheckRow>
        </ul>
        <p className="text-xs text-tertiary">The XRP Ledger decided. No money moved.</p>
        <LedgerLine result={proof.ledger['ledger-rejection'].result} hash={proof.transactions['ledger-rejection']} />
      </UiCard>
      <UiCard label="An agent revoked" className="h-full">
        <MomentHead reference="Lesedi payout agent" title="Credential deleted by the business" badge={<StatusBadge tone="neutral">Revoked</StatusBadge>} />
        <p className="text-sm text-secondary">From the next ledger, the agent cannot pay.</p>
        <LedgerLine result={proof.ledger.revocation.result} hash={proof.transactions.revocation} />
      </UiCard>
    </MomentSequence>
  );
}

/** The opening: a two-line promise, one sentence, the two ways in, and the four moments as real product cards. */
export function Hero({ proof }: { proof: ProofFile }) {
  return (
    <section aria-labelledby="hero-title">
      <div className={`${SITE_WIDTH} grid gap-7 pt-12 pb-8 md:pt-16 md:pb-10`}>
        <h1 id="hero-title" className="text-display-md font-medium text-primary md:text-display-lg xl:text-[3.5rem] xl:leading-[1.12]">
          <span className="block">Your AI agent pays within its rules.</span>{' '}
          <span className="block text-tertiary">Exchanges know exactly who it is.</span>
        </h1>
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center lg:gap-12">
          <p className="max-w-2xl text-lg text-tertiary md:text-xl">
            Naledi Mokoena finished a logo for Lesedi Design Studio. Within a minute, the studio’s AI agent paid her 2 RLUSD. The
            exchange knew exactly who sent the money. The agent could never have paid more than its rules allowed.
          </p>
          <LandingActions />
        </div>
      </div>
      <div className={SITE_WIDTH}>
        <div className="rounded-2xl bg-secondary p-3 md:p-4">
          <Moments proof={proof} />
        </div>
        <div className="flex flex-wrap justify-between gap-x-8 gap-y-1 py-5 text-sm text-tertiary">
          <p>
            <span lang="st">Tšepo</span>, pronounced TSEH-poh, means hope or trust in Sesotho.
          </p>
          <p>Built on the XRP Ledger. Settles in RLUSD.</p>
        </div>
      </div>
    </section>
  );
}
