import * as React from 'react';

export interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {}

export const ScrollArea = React.forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ className = '', children, ...props }, ref) => (
    <div ref={ref} className={['relative overflow-auto', className].join(' ')} {...props}>
      {children}
    </div>
  ),
);
ScrollArea.displayName = 'ScrollArea';
