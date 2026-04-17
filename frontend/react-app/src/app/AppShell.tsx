import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Calendar,
  Compass,
  HandHeart,
  Headset,
  Heart,
  LogOut,
  MessageCircle,
  Shield,
  Sparkles,
  User,
  Users,
} from 'lucide-react';

import { useAuth } from '../lib/auth';

const NAV_ITEMS: {
  to: string;
  icon: typeof Compass;
  label: string;
  end?: boolean;
}[] = [
  { to: '/app', icon: Compass, label: 'Discover', end: true },
  { to: '/app/lovebot', icon: Sparkles, label: 'Concierge' },
  { to: '/app/matches', icon: Heart, label: 'Matches' },
  { to: '/app/inbox', icon: MessageCircle, label: 'Messages' },
  { to: '/app/boards', icon: Users, label: 'Boards' },
  { to: '/app/events', icon: Calendar, label: 'Events' },
  { to: '/app/volunteer', icon: HandHeart, label: 'Volunteer' },
  { to: '/app/support', icon: Headset, label: 'Support' },
  { to: '/app/impact', icon: Sparkles, label: 'Impact' },
];

const MOBILE_NAV_ITEMS: {
  to: string;
  icon: typeof Compass;
  label: string;
  end?: boolean;
}[] = [...NAV_ITEMS, { to: '/app/privacy', icon: Shield, label: 'Privacy' }];

function navClasses(isActive: boolean) {
  return `group relative flex items-center gap-3 rounded-[1.5rem] border-[3px] px-4 py-3 font-bold uppercase tracking-[0.16em] text-[0.72rem] transition-all ${
    isActive
      ? 'nav-active-glow border-[#111111] bg-[#111111] text-white shadow-[6px_6px_0_0_rgba(17,17,17,1)]'
      : 'border-[#111111] bg-[#fffaf2] text-[#111111] shadow-[6px_6px_0_0_rgba(17,17,17,1)] hover:-translate-y-0.5'
  }`;
}

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen app-bg-premium text-[#111111] md:flex">
      <aside className="hidden md:flex fixed inset-y-0 left-0 z-40 w-72 flex-col border-r-4 border-[#111111] bg-[#fffaf2]">
        <div className="border-b-4 border-[#111111] px-6 py-6">
          <div className="app-kicker mb-3">YouAndINotAI</div>
          <div className="text-[2.2rem] font-black uppercase tracking-[-0.08em] leading-none">
            YOUANDI
            <span className="text-[#ff4f00]">NOTAI.</span>
          </div>
          <p className="mt-3 text-sm font-medium text-[#5c594f]">
            Human-first dating, boards, meetups, and verified connection.
          </p>
        </div>

        <nav className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => navClasses(isActive)}
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-[1rem] border-[3px] ${
                      isActive
                        ? 'border-white bg-[#ff4f00] text-white'
                        : 'border-[#111111] bg-[#efe6d8] text-[#111111]'
                    }`}
                  >
                    <item.icon size={18} />
                  </div>
                  <span className="flex-1">{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-3 border-t-4 border-[#111111] px-4 py-5">
          <NavLink
            to="/app/profile"
            className={({ isActive }) => navClasses(isActive)}
          >
            {({ isActive }) => (
              <>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-[1rem] border-[3px] ${
                    isActive
                      ? 'border-white bg-[#ff4f00] text-white'
                      : 'border-[#111111] bg-[#efe6d8] text-[#111111]'
                  }`}
                >
                  <User size={18} />
                </div>
                <span className="flex-1 truncate">
                  {user?.display_name || 'Profile'}
                </span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/app/privacy"
            className={({ isActive }) => navClasses(isActive)}
          >
            {({ isActive }) => (
              <>
                <div
                  className={`flex h-11 w-11 items-center justify-center rounded-[1rem] border-[3px] ${
                    isActive
                      ? 'border-white bg-[#ff4f00] text-white'
                      : 'border-[#111111] bg-[#efe6d8] text-[#111111]'
                  }`}
                >
                  <Shield size={18} />
                </div>
                <span className="flex-1">Privacy</span>
              </>
            )}
          </NavLink>

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-[1.5rem] border-[3px] border-[#111111] bg-[#fffaf2] px-4 py-3 font-bold uppercase tracking-[0.16em] text-[0.72rem] text-[#111111] shadow-[6px_6px_0_0_rgba(17,17,17,1)] transition-all hover:-translate-y-0.5"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] border-[3px] border-[#111111] bg-[#efe6d8] text-[#111111]">
              <LogOut size={18} />
            </div>
            <span className="flex-1 text-left">Sign Out</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-72">
        <header className="sticky top-0 z-40 border-b-4 border-[#111111] bg-[#fffaf2] px-4 py-4 md:hidden">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[0.68rem] font-black uppercase tracking-[0.22em] text-[#ff4f00]">
                YouAndINotAI
              </div>
              <div className="text-xl font-black uppercase tracking-[-0.08em] leading-none text-[#111111]">
                Human Only.
              </div>
            </div>
            <div className="flex items-center gap-2">
              <NavLink
                to="/app/profile"
                className="flex h-11 w-11 items-center justify-center rounded-[1rem] border-[3px] border-[#111111] bg-[#fffaf2] text-[#111111] shadow-[4px_4px_0_0_rgba(17,17,17,1)]"
              >
                <User size={18} />
              </NavLink>
              <button
                onClick={handleLogout}
                className="flex h-11 w-11 items-center justify-center rounded-[1rem] border-[3px] border-[#111111] bg-[#111111] text-white shadow-[4px_4px_0_0_rgba(17,17,17,1)]"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <main className="app-workspace min-h-screen pb-24 md:pb-10">
          <Outlet />
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-50 flex gap-2 overflow-x-auto border-t-4 border-[#111111] bg-[#fffaf2] px-2 py-2 md:hidden">
          {MOBILE_NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex min-w-[92px] shrink-0 flex-col items-center gap-1 rounded-[1rem] border-[3px] px-3 py-2 text-[0.62rem] font-bold uppercase tracking-[0.14em] shadow-[4px_4px_0_0_rgba(17,17,17,1)] transition-all ${
                  isActive
                    ? 'border-[#111111] bg-[#111111] text-white'
                    : 'border-[#111111] bg-[#fffaf2] text-[#111111]'
                }`
              }
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
