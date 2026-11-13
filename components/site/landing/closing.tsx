import { LANDING_ACTIONS } from '../../../src/views/navigation.ts';
import { JoinPilot } from '../join-pilot.tsx';
import { SiteButton } from '../site-button.tsx';
import { SITE_WIDTH } from '../site-chrome.tsx';

const [tour] = LANDING_ACTIONS;

/** The one dark band: the tour, a dare to break the rules, and the pilot. */
export function InkBand() {
  return (
    <section aria-labelledby="cta-title" className="bg-primary-solid">
      <div className={`${SITE_WIDTH} grid gap-8 py-20 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:py-24`}>
        <div className="grid max-w-2xl gap-4">
          <h2 id="cta-title" className="text-display-sm font-medium text-white md:text-display-md">
            See every check work, live, in three minutes.
          </h2>
          <p className="text-lg text-white">
            Take the tour, then try to break the rules yourself: tell the agent to pay someone new or to ignore its limits.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {tour !== undefined && (
            <SiteButton href={tour.href} variant="primary" size="lg" surface="dark">
              {tour.label}
            </SiteButton>
          )}
          <SiteButton href="/business/instruct" variant="secondary" size="lg" surface="dark">
            Try to break it
          </SiteButton>
          <JoinPilot variant="secondary" surface="dark" />
        </div>
      </div>
    </section>
  );
}
