import Link from 'next/link';
import { cx } from '@/utils/cx';

/**
 * The Tšepo logo: the shield and the name, drawn as one wordmark. The image is
 * 96px tall and shown at 28px, so it stays sharp on dense screens. Its text
 * alternative is the name it shows.
 */
function Wordmark() {
  // A fixed, small image: a plain img, with no optimisation pipeline needed.
  return <img src="/tsepo-wordmark.png" alt="Tšepo" width={348} height={96} className="h-7 w-auto shrink-0" />;
}

/**
 * The logo. With `href` it is a link to the landing page, from the product and
 * from every public page.
 */
export function Brand({ href }: { href?: string }) {
  if (href === undefined) {
    return (
      <span className="flex items-center">
        <Wordmark />
      </span>
    );
  }
  return (
    <Link
      href={href}
      className={cx('flex items-center rounded-md outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2')}
      aria-label="Tšepo, home"
    >
      <Wordmark />
    </Link>
  );
}
