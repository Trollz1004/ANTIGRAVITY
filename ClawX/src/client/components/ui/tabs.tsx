import * as React from 'react';
import { createContext, useContext, useState } from 'react';

interface TabsContextValue {
  value: string;
  onValueChange: (v: string) => void;
}

const TabsContext = createContext<TabsContextValue>({ value: '', onValueChange: () => {} });

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export function Tabs({
  value: controlledValue,
  defaultValue = '',
  onValueChange,
  className = '',
  ...props
}: TabsProps) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = controlledValue ?? uncontrolled;
  const handleChange = onValueChange ?? setUncontrolled;
  return (
    <TabsContext.Provider value={{ value, onValueChange: handleChange }}>
      <div className={['flex flex-col', className].join(' ')} {...props} />
    </TabsContext.Provider>
  );
}

export function TabsList({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={[
        'inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground',
        className,
      ].join(' ')}
      role="tablist"
      {...props}
    />
  );
}

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export function TabsTrigger({ value, className = '', children, ...props }: TabsTriggerProps) {
  const ctx = useContext(TabsContext);
  const isActive = ctx.value === value;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? 'active' : 'inactive'}
      className={[
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'disabled:pointer-events-none disabled:opacity-50',
        isActive ? 'bg-background text-foreground shadow-sm' : 'hover:bg-background/50',
        className,
      ].join(' ')}
      onClick={() => ctx.onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export function TabsContent({ value, className = '', ...props }: TabsContentProps) {
  const ctx = useContext(TabsContext);
  if (ctx.value !== value) return null;
  return (
    <div
      role="tabpanel"
      data-state="active"
      className={['mt-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', className].join(' ')}
      {...props}
    />
  );
}
