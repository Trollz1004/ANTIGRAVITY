import * as React from 'react';

export const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={['relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className].join(' ')}
      {...props}
    />
  ),
);
Avatar.displayName = 'Avatar';

export const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(
  ({ className = '', ...props }, ref) => (
    <img ref={ref} className={['aspect-square h-full w-full', className].join(' ')} {...props} />
  ),
);
AvatarImage.displayName = 'AvatarImage';

export const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className = '', ...props }, ref) => (
    <div
      ref={ref}
      className={[
        'flex h-full w-full items-center justify-center rounded-full bg-muted text-muted-foreground',
        className,
      ].join(' ')}
      {...props}
    />
  ),
);
AvatarFallback.displayName = 'AvatarFallback';
