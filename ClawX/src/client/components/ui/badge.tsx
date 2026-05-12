import * as React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive';
}

const variantClasses: Record<string, string> = {
  default: 'bg-primary text-primary-foreground border-transparent',
  secondary: 'bg-secondary text-secondary-foreground border-transparent',
  outline: 'border-border text-foreground',
  destructive: 'bg-destructive text-destructive-foreground border-transparent',
};

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={[
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variantClasses[variant] ?? '',
        className,
      ].join(' ')}
      {...props}
    />
  );
}
