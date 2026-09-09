import * as React from 'react';
import { createContext, useContext, useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface SelectContextValue {
  value: string;
  onValueChange: (v: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
}

const SelectContext = createContext<SelectContextValue>({
  value: '',
  onValueChange: () => {},
  open: false,
  setOpen: () => {},
});

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children?: React.ReactNode;
  disabled?: boolean;
}

export function Select({ value: controlledValue, defaultValue = '', onValueChange, children }: SelectProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const value = controlledValue ?? uncontrolled;
  const handleChange = (v: string) => {
    if (!controlledValue) setUncontrolled(v);
    onValueChange?.(v);
    setOpen(false);
  };
  return (
    <SelectContext.Provider value={{ value, onValueChange: handleChange, open, setOpen }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className = '', children, ...props }: React.HTMLAttributes<HTMLButtonElement>) {
  const { open, setOpen } = useContext(SelectContext);
  return (
    <button
      type="button"
      className={[
        'flex h-10 w-full items-center justify-between rounded-md border border-border bg-background px-3 py-2 text-sm',
        'focus:outline-none focus:ring-2 focus:ring-ring',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      ].join(' ')}
      onClick={() => setOpen(!open)}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50 shrink-0 ml-2" />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = useContext(SelectContext);
  return <span className={value ? '' : 'text-muted-foreground'}>{value || placeholder}</span>;
}

export function SelectContent({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { open, setOpen } = useContext(SelectContext);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, setOpen]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={[
        'absolute z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md',
        className,
      ].join(' ')}
      {...props}
    >
      <div className="p-1">{children}</div>
    </div>
  );
}

export interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function SelectItem({ value, className = '', children, ...props }: SelectItemProps) {
  const ctx = useContext(SelectContext);
  const isSelected = ctx.value === value;
  return (
    <div
      className={[
        'relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none',
        'hover:bg-accent hover:text-accent-foreground',
        isSelected ? 'bg-accent text-accent-foreground font-medium' : '',
        className,
      ].join(' ')}
      onClick={() => ctx.onValueChange(value)}
      {...props}
    >
      {children}
    </div>
  );
}
