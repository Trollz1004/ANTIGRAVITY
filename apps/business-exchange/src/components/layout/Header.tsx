'use client';

import { cn } from '@/lib/utils';
import { Bell, Search, Menu, User, LogOut, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';

interface HeaderProps {
  user: { name?: string | null; email: string };
  onLogout: () => void;
  sidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function Header({ user, onLogout, sidebarCollapsed, onToggleSidebar }: HeaderProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setTheme(saved || (prefersDark ? 'dark' : 'light'));
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-30 h-16 bg-white/80 dark:bg-nexus-950/80 backdrop-blur-md',
        'border-b border-nexus-200 dark:border-nexus-900',
        'transition-all duration-200',
        sidebarCollapsed ? 'left-20' : 'left-64'
      )}
      role="banner"
    >
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Left side - mobile menu toggle */}
        <div className="flex items-center gap-4 lg:hidden">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-nexus-500 hover:bg-nexus-100 dark:hover:bg-nexus-800 transition-colors"
            aria-label="Toggle menu"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Center - search */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-nexus-400" aria-hidden="true" />
            <input
              type="search"
              placeholder="Search listings, deals, messages..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-nexus-100 dark:bg-nexus-800 border-0 rounded-lg text-nexus-900 dark:text-nexus-100 placeholder:text-nexus-500 focus:outline-none focus:ring-2 focus:ring-hydra-500"
              aria-label="Search"
            />
          </div>
        </div>

        {/* Right side - actions */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-nexus-500 hover:bg-nexus-100 dark:hover:bg-nexus-800 transition-colors"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg text-nexus-500 hover:bg-nexus-100 dark:hover:bg-nexus-800 transition-colors relative"
              aria-label="Notifications"
              aria-expanded={showNotifications}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-nexus-900 rounded-lg shadow-xl border border-nexus-200 dark:border-nexus-800 py-2 z-50">
                <div className="px-4 py-2 border-b border-nexus-200 dark:border-nexus-800">
                  <h3 className="text-sm font-semibold text-nexus-900 dark:text-nexus-100">Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="px-4 py-3 text-sm text-nexus-500 dark:text-nexus-400">
                    No new notifications
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-nexus-100 dark:hover:bg-nexus-800 transition-colors"
              aria-label="User menu"
              aria-expanded={showUserMenu}
            >
              <div className="w-8 h-8 rounded-full bg-hydra-100 dark:bg-hydra-900/30 flex items-center justify-center">
                <User className="w-5 h-5 text-hydra-600 dark:text-hydra-400" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-nexus-700 dark:text-nexus-300">
                {user.name || user.email.split('@')[0]}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-nexus-900 rounded-lg shadow-xl border border-nexus-200 dark:border-nexus-800 py-1 z-50">
                <div className="px-4 py-2 border-b border-nexus-200 dark:border-nexus-800">
                  <p className="text-sm font-medium text-nexus-900 dark:text-nexus-100">
                    {user.name || user.email.split('@')[0]}
                  </p>
                  <p className="text-xs text-nexus-500 dark:text-nexus-400 truncate">{user.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-nexus-100 dark:hover:bg-nexus-800"
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}