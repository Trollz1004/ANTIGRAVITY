import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Users, Calendar, HandHeart, User, LogOut, Compass, ShieldCheck } from 'lucide-react';
import { useAuth } from '../lib/auth';

const NAV_ITEMS: { to: string; icon: typeof Compass; label: string; end?: boolean }[] = [
  { to: '/app', icon: Compass, label: 'Discover', end: true },
  { to: '/app/matches', icon: Heart, label: 'Matches' },
  { to: '/app/inbox', icon: MessageCircle, label: 'Messages' },
  { to: '/app/boards', icon: Users, label: 'Boards' },
  { to: '/app/events', icon: Calendar, label: 'Events' },
  { to: '/app/volunteer', icon: HandHeart, label: 'Volunteer' },
];

export function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex">
      {/* Ambient orbs — visible through glass sidebar */}
      <div className="fixed top-20 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-40 left-8 w-24 h-24 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Desktop Sidebar — Glassmorphism */}
      <aside className="hidden md:flex flex-col w-72 glass-strong fixed h-full border-r-0 z-40">
        {/* Top-edge glass highlight */}
        <div className="absolute top-0 left-[10%] right-[10%] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        {/* Logo section */}
        <div className="flex items-center gap-3 px-6 py-6 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Heart size={20} className="text-white" fill="white" />
          </div>
          <div>
            <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 tracking-tight">
              YouAndINotAI
            </span>
            <span className="block text-[10px] text-gray-500 font-medium tracking-widest uppercase">For the kids</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-0.5 stagger-children">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'nav-active-glow bg-white/[0.06] text-white shadow-lg shadow-pink-500/5'
                    : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-br from-pink-500/20 to-purple-500/20'
                      : 'bg-white/[0.04]'
                  }`}>
                    <item.icon size={18} className={isActive ? 'text-pink-400' : ''} />
                  </div>
                  {item.label}
                  {isActive && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-pink-400 shadow-lg shadow-pink-400/50" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bot-Shield CTA */}
        <div className="px-3 mb-2">
          <NavLink
            to="/app/verify"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/20'
                  : 'bg-gradient-to-r from-amber-500/5 to-yellow-500/5 text-amber-400/80 border border-amber-500/10 hover:border-amber-500/20'
              }`
            }
          >
            <ShieldCheck size={18} />
            Get Verified
          </NavLink>
        </div>

        {/* Bottom section */}
        <div className="px-3 pb-4 space-y-1">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mb-3" />
          <NavLink
            to="/app/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive ? 'bg-white/[0.06] text-white' : 'text-gray-400 hover:text-white hover:bg-white/[0.04]'
              }`
            }
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
              <User size={18} className="text-blue-400" />
            </div>
            {user?.display_name || 'Profile'}
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-red-400 hover:bg-red-500/[0.06] transition-all duration-200 w-full"
          >
            <div className="w-9 h-9 rounded-lg bg-white/[0.04] flex items-center justify-center">
              <LogOut size={18} />
            </div>
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-72 pb-20 md:pb-0">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav — Glassmorphism */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-strong border-t-0 flex justify-around py-2 px-1 z-50">
        {/* Top highlight */}
        <div className="absolute top-0 left-[5%] right-[5%] h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all duration-200 ${
                isActive ? 'text-pink-400' : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1.5 rounded-lg transition-all duration-200 ${isActive ? 'bg-pink-500/10' : ''}`}>
                  <item.icon size={20} />
                </div>
                {item.label}
                {isActive && (
                  <div className="w-4 h-0.5 rounded-full bg-pink-400 mt-0.5" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
