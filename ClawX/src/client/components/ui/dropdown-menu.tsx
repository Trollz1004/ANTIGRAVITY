import * as React from 'react';
import { createContext, useContext, useState, useRef, useEffect } from 'react';

interface DropdownMenuContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextValue>({ open: false, setOpen: () => {} });

export function DropdownMenu({ children }: { children?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <DropdownMenuContext.Provider value={{ open, setOpen }}>
      <div className="relative">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export interface DropdownMenuTriggerProps {
  asChild?: boolean;
  children?: React.ReactNode;
}

export function DropdownMenuTrigger({ asChild, children }: DropdownMenuTriggerProps) {
  const { open, setOpen } = useContext(DropdownMenuContext);
  const handleClick = () => setOpen(!open);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
    });
  }
  return <button onClick={handleClick}>{children}</button>;
}

export interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

export function DropdownMenuContent({
  className = '',
  align = 'start',
  children,
  ...props
}: DropdownMenuContentProps) {
  const { open, setOpen } = useContext(DropdownMenuContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open, setOpen]);

  if (!open) return null;

  const alignClass = align === 'end' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0';

  return (
    <div
      ref={ref}
      className={[
        'absolute z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-md',
        alignClass,
        className,
      ].join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({ className = '', onClick, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { setOpen } = useContext(DropdownMenuContext);
  return (
    <div
      className={[
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus:bg-accent focus:text-accent-foreground',
        className,
      ].join(' ')}
      onClick={(e) => {
        onClick?.(e);
        setOpen(false);
      }}
      {...props}
    >
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={['-mx-1 my-1 h-px bg-border', className].join(' ')} {...props} />;
}

export function DropdownMenuLabel({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={['px-2 py-1.5 text-xs font-semibold text-muted-foreground', className].join(' ')} {...props} />;
}
