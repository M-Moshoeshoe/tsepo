import { ArrowRight } from '@untitledui/icons';
import Link from 'next/link';
import { cx } from '@/utils/cx';

type Tone = 'primary' | 'secondary' | 'inverse' | 'outline-inverse';
type Size = 'sm' | 'lg';

/** The quiet pill on the dark band. Exported so the Join the pilot dialog button can wear it too. */
export const OUTLINE_INVERSE = 'bg-transparent text-white ring-1 ring-white/30 ring-inset hover:bg-white/10 hover:text-white';

/** The pill shape and type at the large size, for a button that is not a link. */
export const PILL_LG = 'h-12 gap-2 rounded-full px-6 text-md font-medium shadow-none before:hidden';

/**
 * The two calls to action of the public pages: a solid ink pill and a quiet
 * outlined pill, flat with no gloss or gradient, set in medium weight. The
 * primary carries an arrow that steps forward on hover; the step switches off
 * for reduced motion. "inverse" is the primary on the dark closing band, and
 * "outline-inverse" the quiet pill beside it.
 */
const TONES: Record<Tone, string> = {
  primary: 'bg-primary-solid text-white hover:bg-neutral-800',
  secondary: 'bg-primary text-primary ring-1 ring-primary ring-inset hover:bg-secondary',
  inverse: 'bg-white text-primary hover:bg-neutral-100',
  'outline-inverse': OUTLINE_INVERSE,
};

const SIZES: Record<Size, string> = {
  sm: 'h-9 gap-1.5 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-md',
};

export function SiteButton({ href, tone, size, children }: { href: string; tone: Tone; size: Size; children: string }) {
  const arrow = tone === 'primary' || tone === 'inverse';
  return (
    <Link
      href={href}
      className={cx(
        'group inline-flex shrink-0 items-center justify-center rounded-full font-medium tracking-[-0.005em] whitespace-nowrap transition-colors duration-150',
        'outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2',
        TONES[tone],
        SIZES[size],
      )}
    >
      {children}
      {arrow && (
        <ArrowRight
          aria-hidden
          className={cx('shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0', size === 'sm' ? 'size-4' : 'size-[18px]')}
        />
      )}
    </Link>
  );
}
