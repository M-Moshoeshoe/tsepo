import type { ComponentProps } from 'react';
import { cn } from './cn.ts';

/** A placeholder block with a gentle shimmer, still for reduced motion. */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('shimmer rounded-md', className)} aria-hidden {...props} />;
}
