import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from './cn.ts';

const badgeVariants = cva('inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium leading-5', {
  variants: {
    tone: {
      cleared: 'bg-cleared-bg text-cleared',
      held: 'bg-held-bg text-held',
      refused: 'bg-refused-bg text-refused',
      neutral: 'border border-border bg-surface text-muted',
    },
  },
  defaultVariants: { tone: 'neutral' },
});

export type BadgeTone = NonNullable<VariantProps<typeof badgeVariants>['tone']>;

export function Badge({ className, tone, ...props }: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
