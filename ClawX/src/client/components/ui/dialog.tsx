import * as React from 'react';
import { createContext, useContext } from 'react';

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue>({ open: false, onOpenChange: () => {} });

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
}

export function Dialog({ open = false, onOpenChange = () => {}, children }: DialogProps) {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
}

export interface DialogTriggerProps {
  asChild?: boolean;
  children?: React.ReactNode;
}

export function DialogTrigger({ asChild, children }: DialogTriggerProps) {
  const { onOpenChange } = useContext(DialogContext);
  const handleClick = () => onOpenChange(true);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
    });
  }

  return <button onClick={handleClick}>{children}</button>;
}

export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {}

export function DialogContent({ className = '', children, ...props }: DialogContentProps) {
  const { open, onOpenChange } = useContext(DialogContext);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[var(--z-modal-backdrop)] flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={() => onOpenChange(false)} />
      <div
        className={[
          'relative z-[var(--z-modal)] w-full max-w-lg rounded-xl border border-border bg-background p-6 shadow-xl',
          className,
        ].join(' ')}
        {...props}
      >
        <button
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          onClick={() => onOpenChange(false)}
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={['flex flex-col space-y-1.5 text-center sm:text-left', className].join(' ')} {...props} />;
}

export function DialogTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={['text-lg font-semibold leading-none tracking-tight', className].join(' ')}
      {...props}
    />
  );
}

export function DialogDescription({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={['text-sm text-muted-foreground', className].join(' ')} {...props} />;
}
