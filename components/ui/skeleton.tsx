import type { ComponentProps } from 'react';
import { cn } from './cn.ts';

/** A static placeholder block. It does not animate: the check timeline is the only motion. */
export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('rounded-md bg-border/60', className)} aria-hidden {...props} />;
}
