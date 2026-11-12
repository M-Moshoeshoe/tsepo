import type { ComponentProps } from 'react';
import { cn } from './cn.ts';

export function Input({ className, ...props }: ComponentProps<'input'>) {
  return (
    <input
      className={cn(
        'h-9 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink tabular-nums placeholder:text-muted aria-invalid:border-refused',
        className,
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }: ComponentProps<'label'>) {
  return <label className={cn('text-sm font-medium text-ink', className)} {...props} />;
}
