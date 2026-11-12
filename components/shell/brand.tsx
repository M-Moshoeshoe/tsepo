import Link from 'next/link';
import { cx } from '@/utils/cx';

/** The Tšepo logo: the shield mark and the name. The mark is a 256px PNG drawn at 24px, so it stays sharp on dense screens. */
export function BrandMark({ className }: { className?: string }) {
  // A fixed, tiny decorative image: a plain img, with no optimisation pipeline needed.
  return <img src="/tsepo-mark.png" alt="" width={24} height={24} className={cx('size-6 shrink-0', className)} />;
}

/**
 * The logo and name. With `href` it is a link: in the product it opens the
 * current workspace's overview, on the landing page the top of the page.
 */
export function Brand({ href }: { href?: string }) {
  const content = (
    <>
      <BrandMark />
      Tšepo
    </>
  );
  const style = 'flex items-center gap-2 text-md font-semibold text-primary';
  if (href === undefined) return <span className={style}>{content}</span>;
  return (
    <Link href={href} className={cx(style, 'rounded-md outline-focus-ring focus-visible:outline-2 focus-visible:outline-offset-2')} aria-label={href === "/" ? "Tšepo, home" : "Tšepo, go to the overview"}>
      {content}
    </Link>
  );
}
