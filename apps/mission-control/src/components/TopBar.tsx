import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/useAuth';
import { Heart, Share2 } from 'lucide-react';
import { NotificationBell } from './NotificationBell';
import { ThemeToggle } from './ThemeToggle';

/**
 * Top Bar Component
 *
 * Displays the persistent header bar across the Mission Control dashboard.
 * Shows mission branding (#UntilNoKidInNeed), financial commitment stats,
 * the build badge, and a share button.
 *
 * All monetary values are currently placeholder `$0.00` — live treasury
 * data must be wired before real balances are displayed.
 *
 * @component
 * @example
 * ```tsx
 * <TopBar />
 * ```
 */
export const TopBar: React.FC = () => {
  const { token } = useAuth();

  const handleLogin = () => {
    localStorage.setItem('auth_token', 'dummy-jwt-token');
    window.location.reload(); // Reload to trigger AuthProvider re-read
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    window.location.reload(); // Reload to trigger AuthProvider re-read
  };

  return (
    <div data-testid="topbar" className="flex items-center justify-between bg-panel px-4 py-2 border-b border-border">
      {/* Left side: mission branding and financial stats */}
      <div className="flex items-center gap-6 text-xs font-mono">
      <span className="text-accentMagenta flex items-center gap-1">
        <Heart size={12} /> #UntilNoKidInNeed
      </span>
      <span className="text-gray-400">
        committed <span className="text-gray-200">$0.00</span>
      </span>
      <span className="text-gray-400">
        kids fund <span className="text-gray-200">$0.00</span>
      </span>
      <span className="text-gray-400" title="$250 USD per kid threshold">
        kids covered (est.) <span className="text-accentCyan">0</span>
      </span>
    </div>
    {/* Right side: build badge, share button, and notifications */}
    <div className="flex items-center gap-3">
      <ThemeToggle />
      <NotificationBell />
      <span className="text-[10px] font-mono uppercase tracking-wider text-gray-500">OpusPawClaw · Mission Control</span>
      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-accentCyan/10 border border-accentCyan/30 text-accentCyan">
        BUILT · E1
      </span>
      <button className="flex items-center gap-1 px-2 py-1 text-xs font-mono rounded border border-border hover:border-accentCyan/50 transition text-gray-300">
        <Share2 size={12} /> share
      </button>
      {token ? (
        <button
          data-testid="logout-button"
          onClick={handleLogout}
          className="flex items-center gap-1 px-2 py-1 text-xs font-mono rounded border border-red-500/50 hover:border-red-500 transition text-red-400"
        >
          Logout
        </button>
      ) : (
        <button
          data-testid="login-button"
          onClick={handleLogin}
          className="flex items-center gap-1 px-2 py-1 text-xs font-mono rounded border border-green-500/50 hover:border-green-500 transition text-green-400"
        >
          Login
        </button>
      )}
    </div>
  </div>
);
};