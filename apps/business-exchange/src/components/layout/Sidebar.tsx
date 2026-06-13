'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Home,
  Briefcase,
  FileText,
  MessageSquare,
  Shield,
  Settings,
  Users,
  BarChart2,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';

const navigation = [
  { name: 'Marketplace', href: '/dashboard', icon: Home },
  { name: 'My Listings', href: '/dashboard/my-listings', icon: Briefcase },
  { name: 'Active Deals', href: '/dashboard/pipeline', icon: FileText },
  { name: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
  { name: 'Verification', href: '/dashboard/verification', icon: Shield },
];

const adminNavigation = [
  { name: 'Audit Log', href: '/admin/audit', icon: BarChart2 },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

interface SidebarProps {
  user: { name?: string | null; email: string; role: string };
  onLogout: () => void;
  isAdmin?: boolean;
}

export function Sidebar({ user, onLogout, isAdmin = false }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen bg-white dark:bg-nexus-950 border-r border-nexus-200 dark:border-nexus-900',
        'transition-all duration-200 ease-in-out',
        collapsed ? 'w-20' : 'w-64'
      )}
      aria-label="Main navigation"
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn('flex h-16 items-center px-4 border-b border-nexus-200 dark:border-nexus-900', collapsed && 'justify-center')}>
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-lg text-nexus-900 dark:text-nexus-100">
              <svg className="w-8 h-8 text-hydra-600" viewBox="0 0 64 64" fill="none">
                <path d="M20 10h24l12 22-12 22H20L8 32 20 10Z" stroke="currentColor" strokeWidth="3"/>
                <path d="M23 24h18M23 32h18M23 40h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
              <span>Business Exchange</span>
            </Link>
          )}
          {collapsed && (
            <Link href="/dashboard" className="text-hydra-600" aria-label="Business Exchange">
              <svg className="w-8 h-8" viewBox="0 0 64 64" fill="none">
                <path d="M20 10h24l12 22-12 22H20L8 32 20 10Z" stroke="currentColor" strokeWidth="3"/>
                <path d="M23 24h18M23 32h18M23 40h10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
              </svg>
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-2" aria-label="Sidebar navigation">
          <ul className="space-y-1" role="list">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                      'focus:outline-none focus:ring-2 focus:ring-hydra-500 focus:ring-offset-2',
                      isActive
                        ? 'bg-hydra-50 text-hydra-700 dark:bg-hydra-900/20 dark:text-hydra-400'
                        : 'text-nexus-600 hover:bg-nexus-100 dark:text-nexus-400 dark:hover:bg-nexus-800',
                      collapsed && 'justify-center px-2'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                    title={collapsed ? item.name : undefined}
                  >
                    <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-hydra-600 dark:text-hydra-400')} aria-hidden="true" />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>

          {isAdmin && (
            <>
              <div className="my-4 border-t border-nexus-200 dark:border-nexus-800" />
              {!collapsed && (
                <p className="px-3 text-xs font-semibold text-nexus-400 dark:text-nexus-500 uppercase tracking-wider">
                  Administration
                </p>
              )}
              <ul className="space-y-1" role="list">
                {adminNavigation.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon = item.icon;
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                          'focus:outline-none focus:ring-2 focus:ring-hydra-500 focus:ring-offset-2',
                          isActive
                            ? 'bg-hydra-50 text-hydra-700 dark:bg-hydra-900/20 dark:text-hydra-400'
                            : 'text-nexus-600 hover:bg-nexus-100 dark:text-nexus-400 dark:hover:bg-nexus-800',
                          collapsed && 'justify-center px-2'
                        )}
                        aria-current={isActive ? 'page' : undefined}
                        title={collapsed ? item.name : undefined}
                      >
                        <Icon className={cn('w-5 h-5 flex-shrink-0', isActive && 'text-hydra-600 dark:text-hydra-400')} aria-hidden="true" />
                        {!collapsed && <span>{item.name}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </nav>

        {/* User footer & collapse toggle */}
        <div className="p-4 border-t border-nexus-200 dark:border-nexus-900">
          {!collapsed && (
            <div className="mb-3">
              <p className="text-sm font-medium text-nexus-900 dark:text-nexus-100 truncate">
                {user.name || user.email.split('@')[0]}
              </p>
              <p className="text-xs text-nexus-500 dark:text-nexus-400 truncate">{user.email}</p>
              <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full bg-hydra-100 text-hydra-700 dark:bg-hydra-900/30 dark:text-hydra-400">
                {user.role}
              </span>
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={cn(
              'w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg',
              'text-nexus-500 hover:bg-nexus-100 dark:hover:bg-nexus-800 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-hydra-500'
            )}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span className="text-sm font-medium">Collapse</span>
              </>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}