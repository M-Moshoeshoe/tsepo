import { ArrowRight } from '@untitledui/icons';
import Link from 'next/link';
import type { ComponentType, MouseEventHandler, ReactNode } from 'react';
import { cx } from '@/utils/cx';

/**
 * The one button of the public pages. Every button and button-like link on
 * them comes from here, so they share one set of sizes, weights, colours and
 * hover, focus and press states.
 *
 * - primary: the solid ink pill, with an arrow that steps forward on hover.
 * - secondary: the outlined pill.
 * - quiet: a text action with an arrow, or a round icon button.
 *
 * On the dark closing band, `surface="dark"` gives the same variants in
 * light colours. Motion switches off for reduced motion.
 */
export type ButtonVariant = 'primary' | 'secondary' | 'quiet';
export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'group inline-flex shrink-0 items-center justify-center font-medium tracking-[-0.005em] whitespace-nowrap select-none transition-[background-color,color,box-shadow,transform] duration-150 outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2 active:translate-y-px motion-reduce:transition-none motion-reduce:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50';

const PILL: Record<ButtonSize, string> = {
  sm: 'h-9 gap-1.5 rounded-full px-4 text-sm',
  md: 'h-10 gap-1.5 rounded-full px-5 text-sm',
  lg: 'h-12 gap-2 rounded-full px-6 text-md',
};

const QUIET: Record<ButtonSize, string> = {
  sm: 'gap-1 rounded-sm text-sm',
  md: 'gap-1 rounded-sm text-sm',
  lg: 'gap-1.5 rounded-sm text-md',
};

const ICON: Record<ButtonSize, string> = {
  sm: 'size-8 rounded-full',
  md: 'size-9 rounded-full',
  lg: 'size-11 rounded-full',
};

const COLOURS: Record<'light' | 'dark', Record<ButtonVariant, string>> = {
  light: {
    primary: 'bg-primary-solid text-white hover:bg-neutral-800 active:bg-neutral-900',
    secondary: 'bg-primary text-primary ring-1 ring-primary ring-inset hover:bg-secondary active:bg-tertiary',
    quiet: 'font-semibold text-brand-secondary hover:text-brand-secondary_hover',
  },
  dark: {
    primary: 'bg-white text-primary hover:bg-neutral-100 active:bg-neutral-200',
    secondary: 'bg-transparent text-white ring-1 ring-white/30 ring-inset hover:bg-white/10 active:bg-white/15',
    quiet: 'font-semibold text-white hover:text-white/80',
  },
};

/** The quiet round icon button, such as the carousel arrows, wears a hairline ring. */
const ICON_RING = 'text-secondary ring-1 ring-secondary hover:bg-secondary hover:text-primary';

interface Common {
  variant: ButtonVariant;
  size?: ButtonSize;
  surface?: 'light' | 'dark';
  /** The forward arrow. On by default for primary and quiet text actions. */
  arrow?: boolean;
  /** A leading icon, such as Pause or Play. */
  icon?: ComponentType<{ className?: string }>;
  /** An icon-only button: the icon alone, with this accessible name. */
  iconLabel?: string;
  className?: string;
  children?: ReactNode;
}

type AsLink = Common & { href: string; external?: boolean };
type AsButton = Common & {
  href?: undefined;
  type?: 'button' | 'submit';
  onClick?: MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  /** Shows the button as busy while a form is sent. It stays the same size. */
  busy?: boolean;
};

export type SiteButtonProps = AsLink | AsButton;

/** The class names for a button, so a link that must be a plain anchor (such as a download) can wear them too. */
export function siteButtonClass({ variant, size = 'lg', surface = 'light', iconLabel, className }: Omit<Common, 'children' | 'icon' | 'arrow'>): string {
  const shape = iconLabel !== undefined ? ICON[size] : variant === 'quiet' ? QUIET[size] : PILL[size];
  const colour = iconLabel !== undefined && variant === 'quiet' ? ICON_RING : COLOURS[surface][variant];
  return cx(BASE, shape, colour, className);
}

function Content({ variant, size = 'lg', arrow, icon: Icon, iconLabel, children }: Common) {
  const showArrow = iconLabel === undefined && (arrow ?? variant !== 'secondary');
  const iconSize = size === 'lg' ? 'size-[18px]' : 'size-4';
  return (
    <>
      {Icon !== undefined && <Icon className={cx(iconSize, 'shrink-0')} aria-hidden />}
      {iconLabel === undefined ? children : <span className="sr-only">{iconLabel}</span>}
      {showArrow && (
        <ArrowRight
          aria-hidden
          className={cx(iconSize, 'shrink-0 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0')}
        />
      )}
    </>
  );
}

export function SiteButton(props: SiteButtonProps) {
  const className = siteButtonClass(props);
  if (props.href !== undefined) {
    const { href, external = false } = props;
    if (external) {
      return (
        <a href={href} target="_blank" rel="noreferrer" className={className}>
          <Content {...props} />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      );
    }
    return (
      <Link href={href} className={className}>
        <Content {...props} />
      </Link>
    );
  }
  const { type = 'button', onClick, disabled = false, busy = false } = props;
  return (
    <button type={type} onClick={onClick} disabled={disabled || busy} aria-busy={busy || undefined} className={className}>
      <Content {...props} />
    </button>
  );
}
