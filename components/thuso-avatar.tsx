import { cx } from '@/utils/cx';

/**
 * Thuso's avatar: an ink ring that opens into a speech tail, around a solid
 * core, on a disc in the accent colour. The ring is the reading and the tail
 * the explaining. It is round where the Tšepo shield is pointed, so the two
 * never read as one, and it is drawn on a 24-unit grid with heavy strokes, so
 * it stays legible from 20px to 48px. Decorative: Thuso's name is always next
 * to it.
 */
export function ThusoAvatar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx('size-5 shrink-0', className)} aria-hidden>
      <circle cx="12" cy="12" r="12" className="fill-accent" />
      <path
        d="M7.02 14.32A5.5 5.5 0 1 1 9.68 16.98L5.9 18.1Z"
        fill="none"
        stroke="#0B1F2E"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="1.9" fill="#0B1F2E" />
    </svg>
  );
}
