'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: ReactNode;
  user: { name?: string | null; email: string; role: string };
  onLogout: () => void;
  isAdmin?: boolean;
}

export function DashboardLayout({ children, user, onLogout, isAdmin = false }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-nexus-50 dark:bg-nexus-950" data-theme="dark">
      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        user={user}
        onLogout={onLogout}
        isAdmin={isAdmin}
      />

      {/* Main content area */}
      <div
        className={cn(
          'transition-all duration-200',
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
        {/* Header */}
        <Header
          user={user}
          onLogout={onLogout}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setMobileSidebarOpen(true)}
        />

        {/* Page content */}
        <main
          className={cn(
            'pt-16 min-h-screen transition-all duration-200',
            sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          )}
          role="main"
        >
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}