import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from './cn.ts';

const buttonVariants = cva(
  'press inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border text-sm font-medium disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'border-teal bg-teal text-white hover:border-teal-hover hover:bg-teal-hover',
        secondary: 'border-border bg-surface text-ink hover:bg-background',
        danger: 'border-refused bg-refused text-white hover:opacity-90',
        'danger-outline': 'border-border bg-surface text-refused hover:bg-refused-bg',
        ghost: 'border-transparent bg-transparent text-teal hover:bg-background',
      },
      size: {
        md: 'h-9 px-4',
        sm: 'h-8 px-3',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot.Root : 'button';
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
