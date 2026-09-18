import * as React from 'react';
import { createContext, useContext, useState } from 'react';

interface SidebarContextValue {
  state: 'expanded' | 'collapsed';
  toggleSidebar: () => void;
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  state: 'expanded',
  toggleSidebar: () => {},
  isMobile: false,
  openMobile: false,
  setOpenMobile: () => {},
});

export function useSidebar() {
  return useContext(SidebarContext);
}

export interface SidebarProviderProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultOpen?: boolean;
}

export function SidebarProvider({ children, className = '', style, ...props }: SidebarProviderProps) {
  const [state, setState] = useState<'expanded' | 'collapsed'>('expanded');
  const [openMobile, setOpenMobile] = useState(false);

  const toggleSidebar = () => setState((s) => (s === 'expanded' ? 'collapsed' : 'expanded'));

  return (
    <SidebarContext.Provider value={{ state, toggleSidebar, isMobile: false, openMobile, setOpenMobile }}>
      <div
        className={['flex min-h-screen w-full', className].join(' ')}
        data-sidebar-state={state}
        style={style}
        {...props}
      >
        {children}
      </div>
    </SidebarContext.Provider>
  );
}

export interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  collapsible?: 'icon' | 'offcanvas' | 'none';
  side?: 'left' | 'right';
  variant?: 'sidebar' | 'floating' | 'inset';
  disableTransition?: boolean;
}

export function Sidebar({ className = '', children, collapsible, disableTransition, ...props }: SidebarProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  return (
    <div
      className={[
        'flex flex-col shrink-0 bg-sidebar border-r border-border h-screen sticky top-0',
        isCollapsed && collapsible === 'icon' ? 'w-14' : 'w-[var(--sidebar-width,280px)]',
        disableTransition ? '' : 'transition-[width] duration-200',
        className,
      ].join(' ')}
      data-state={state}
      data-collapsible={collapsible}
      {...props}
    >
      {children}
    </div>
  );
}

export function SidebarHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={['flex shrink-0 items-center', className].join(' ')} {...props} />;
}

export function SidebarContent({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={['flex flex-col flex-1 overflow-y-auto overflow-x-hidden', className].join(' ')} {...props} />;
}

export function SidebarFooter({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={['flex shrink-0 flex-col', className].join(' ')} {...props} />;
}

export function SidebarMenu({ className = '', ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={['flex flex-col gap-0.5 list-none', className].join(' ')} {...props} />;
}

export function SidebarMenuItem({ className = '', ...props }: React.HTMLAttributes<HTMLLIElement>) {
  return <li className={['group/menu-item relative', className].join(' ')} {...props} />;
}

export interface SidebarMenuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isActive?: boolean;
  tooltip?: string;
}

export function SidebarMenuButton({ className = '', isActive, tooltip, children, ...props }: SidebarMenuButtonProps) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  return (
    <button
      title={isCollapsed && tooltip ? tooltip : undefined}
      data-active={isActive}
      className={[
        'flex w-full items-center gap-2 rounded-md px-2 text-sm font-medium transition-colors',
        'hover:bg-accent hover:text-accent-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground',
        isCollapsed ? 'justify-center px-0' : '',
        className,
      ].join(' ')}
      {...props}
    >
      {isCollapsed ? React.Children.toArray(children)[0] : children}
    </button>
  );
}

export function SidebarInset({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={['flex flex-1 flex-col min-w-0 overflow-hidden', className].join(' ')} {...props} />;
}

export function SidebarTrigger({ className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { toggleSidebar } = useSidebar();
  return (
    <button
      className={['inline-flex items-center justify-center rounded-md', className].join(' ')}
      onClick={toggleSidebar}
      {...props}
    />
  );
}
