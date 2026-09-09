import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Compass,
  Heart,
  LogOut,
  MessageCircle,
  Plus,
  Settings,
  Sparkles,
  User,
  Video,
  Wand2,
} from 'lucide-react';

import { useAuth } from '../lib/auth';

const MOBILE_NAV = [
  { to: '/app', icon: Heart, label: 'Chats', end: true },
  { to: '/app/inbox', icon: MessageCircle, label: 'Message' },
  { to: '/app/create', icon: Plus, label: 'Create', center: true },
  { to: '/app/matches', icon: Video, label: 'Video' },
  { to: '/app/profile', icon: Settings, label: 'Settings' },
] as const;

const DESKTOP_NAV = [
  { to: '/app', icon: Compass, label: 'Discover', end: true },
  { to: '/app/matches', icon: Heart, label: 'Matches' },
  { to: '/app/inbox', icon: MessageCircle, label: 'Messages' },
  { to: '/app/create', icon: Wand2, label: 'Create' },
  { to: '/app/video-lobby', icon: Video, label: 'Video' },
  { to: '/app/avatar', icon: Sparkles, label: 'Animate' },
  { to: '/app/preorder', icon: Sparkles, label: 'Elite' },
  { to: '/app/profile', icon: User, label: 'Profile' },
] as const;

function navDesktop(isActive: boolean) {
  return `km-nav-item ${isActive ? 'km-nav-item-active' : ''}`;
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="km-shell min-h-screen text-[var(--km-text)] md:flex">
      {/* Desktop rail */}
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-72 flex-col border-r border-[var(--km-border)] bg-[var(--km-surface)]/90 backdrop-blur-xl">
        <div className="border-b border-[var(--km-border)] px-6 py-6">
          <div className="flex items-center gap-2">
            <span className="km-heart-mark" aria-hidden>
              ♥
            </span>
            <div className="text-xl font-semibold tracking-tight bg-gradient-to-r from-[#a78bfa] via-[#f0abfc] to-[#67e8f9] bg-clip-text text-transparent">
              YouAndINotAI
            </div>
          </div>
          <p className="mt-3 text-sm text-[var(--km-muted)]">
            Verified humans. Real video. Optional animated avatar.
          </p>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
          {DESKTOP_NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={'end' in item ? item.end : false}
              className={({ isActive }) => navDesktop(isActive)}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t border-[var(--km-border)] px-4 py-5">
          <div className="km-card px-4 py-3">
            <div className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-[var(--km-accent)]">
              Signed in
            </div>
            <div className="mt-1 truncate text-sm font-semibold">
              {user?.display_name || user?.email || 'Member'}
            </div>
            <div className="mt-1 text-xs text-[var(--km-muted)]">Free Plan</div>
          </div>
          <button
            onClick={handleLogout}
            className="km-btn-ghost w-full justify-start gap-3"
          >
            <LogOut size={18} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-72">
        {/* Mobile top bar — Kiss Me style */}
        <header className="sticky top-0 z-40 border-b border-[var(--km-border)] bg-[var(--km-bg)]/85 px-4 py-3 backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="km-heart-mark text-lg" aria-hidden>
                ♥
              </span>
              <div>
                <div className="text-base font-semibold tracking-tight bg-gradient-to-r from-[#a78bfa] via-[#f0abfc] to-[#67e8f9] bg-clip-text text-transparent">
                  YouAndINotAI
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NavLink to="/app/preorder" className="km-chip">
                Elite
              </NavLink>
              <NavLink
                to="/app/profile"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--km-border)] bg-[var(--km-surface)]"
              >
                <User size={18} />
              </NavLink>
            </div>
          </div>
        </header>

        <main className="km-workspace min-h-screen pb-28 md:pb-10">
          <Outlet />
        </main>

        {/* Mobile bottom nav — Chats / Message / Create / Video / Settings */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--km-border)] bg-[var(--km-bg)]/92 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-xl md:hidden">
          <div className="grid grid-cols-5 items-end gap-1">
            {MOBILE_NAV.map(item => {
              const isCenter = 'center' in item && item.center;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={'end' in item ? item.end : false}
                  className={({ isActive }) =>
                    isCenter
                      ? `km-fab-nav ${isActive ? 'km-fab-nav-active' : ''}`
                      : `km-bottom-item ${isActive ? 'km-bottom-item-active' : ''}`
                  }
                >
                  <item.icon size={isCenter ? 22 : 18} />
                  {!isCenter && <span>{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
