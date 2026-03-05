import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Users, Calendar, HandHeart, User, LogOut, Compass } from 'lucide-react';
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
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900 border-r border-white/10 p-4 fixed h-full">
        <div className="flex items-center gap-3 mb-8">
          <img src="/logo.png" alt="" className="w-10 h-10 rounded-full" />
          <span className="text-lg font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-500">
            YouAndINotAI
          </span>
        </div>

        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gradient-to-r from-pink-500/20 to-purple-500/20 text-white border border-pink-500/30'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 pt-4 space-y-2">
          <NavLink
            to="/app/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                isActive ? 'text-white bg-white/10' : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <User size={20} />
            {user?.display_name || 'Profile'}
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors w-full"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64">
        <Outlet />
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-white/10 flex justify-around py-2 px-1 z-50">
        {NAV_ITEMS.slice(0, 5).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors ${
                isActive ? 'text-pink-400' : 'text-gray-500'
              }`
            }
          >
            <item.icon size={20} />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
