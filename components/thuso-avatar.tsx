import { cx } from '@/utils/cx';

/**
 * Thuso's avatar: the mascot's head on black, in a circle. It is sized by
 * the caller (20px by default, up to 48px) and is decorative, because
 * Thuso's name always appears next to it. The image is a 160px WebP made
 * from the mascot artwork, so it stays sharp at every size used.
 */
export function ThusoAvatar({ className }: { className?: string }) {
  return (
    // A fixed, tiny decorative image: a plain img, with no optimisation pipeline needed.
    <img src="/thuso-head.webp" alt="" width={160} height={160} className={cx('size-5 shrink-0 rounded-full bg-black', className)} />
  );
}
