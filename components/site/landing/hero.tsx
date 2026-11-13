import { CheckVerified01 } from '@untitledui/icons';
import { LANDING_ACTIONS } from '../../../src/views/navigation.ts';
import { SiteButton } from '../site-button.tsx';
import { SITE_WIDTH } from '../site-chrome.tsx';

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

/** The photo widths prepared in public/landing, smallest first. */
const WIDTHS = [640, 960, 1136] as const;

function srcSet(format: 'avif' | 'webp'): string {
  return WIDTHS.map((width) => `/landing/hero-${String(width)}.${format} ${String(width)}w`).join(', ');
}

/**
 * The hero photo, prepared ahead of time as AVIF and WebP at three widths
 * with a JPEG fallback, so no image service runs on the server. It is the
 * largest thing on the first screen, so it loads first.
 */
function HeroPhoto() {
  const sizes = '(min-width: 1024px) 50vw, 100vw';
  return (
    <picture>
      <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
      <img
        src="/landing/hero-1136.jpg"
        width={1136}
        height={640}
        alt="A worried man rests his head in his hand behind a piggy bank and loose coins on a glass table."
        fetchPriority="high"
        decoding="async"
        className="aspect-[16/9] w-full rounded-2xl object-cover"
      />
    </picture>
  );
}

/** The opening: one human question, one line on what Tšepo does, the two ways in, and a photo with one real product card. */
export function Hero() {
  return (
    <section aria-labelledby="hero-title">
      <div className={`${SITE_WIDTH} grid gap-8 pt-12 pb-6 md:pt-16 lg:grid-cols-2 lg:items-center lg:gap-12`}>
        <div className="grid content-center gap-6">
          <h1 id="hero-title" className="text-display-md font-medium text-primary md:text-display-lg">
            Would you hand an AI your company’s money?
          </h1>
          <p className="max-w-xl text-lg text-tertiary md:text-xl">
            Tšepo gives AI agents rules they cannot break, and an ID that proves who they work for.
          </p>
          <LandingActions />
        </div>
        <div className="relative">
          <HeroPhoto />
          <div className="absolute right-3 bottom-3 left-3 flex items-start gap-3 rounded-xl bg-primary p-3 shadow-lg ring-1 ring-secondary sm:right-auto sm:max-w-xs md:bottom-5 md:left-5">
            <CheckVerified01 className="mt-0.5 size-5 shrink-0 text-fg-success-primary" aria-hidden />
            <p className="grid text-sm">
              <span className="font-semibold text-primary">Paid 2 RLUSD.</span>
              <span className="text-secondary">Verified agent, within its rules.</span>
            </p>
          </div>
        </div>
      </div>
      <div className={`${SITE_WIDTH} flex flex-wrap justify-between gap-x-8 gap-y-1 pb-5 text-sm text-tertiary`}>
        <p>
          <span lang="st">Tšepo</span>, pronounced TSEH-poh, means hope or trust in Sesotho.
        </p>
        <p>Built on the XRP Ledger. Settles in RLUSD.</p>
      </div>
    </section>
  );
}
