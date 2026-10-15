import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { UnverifiedGate } from './components/UnverifiedGate';

// Pages the API rejects with 403 "Verification required" for unverified users.
// Exact match for /app (Discover); prefix match for the rest.
const GATED_PREFIXES = [
  '/app/matches',
  '/app/inbox',
  '/app/chat',
  '/app/video',
  '/app/create',
  '/app/avatar',
];

function needsVerification(pathname: string): boolean {
  const clean = pathname.replace(/\/+$/, '');
  if (clean === '/app') return true;
  return GATED_PREFIXES.some(p => clean === p || clean.startsWith(p + '/') || clean.startsWith(p + '-'));
}

export function AuthGuard() {
  const { user, loading, fetchUser } = useAuth();
  const location = useLocation();

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  if (loading) {
    return (
      <div className="min-h-screen app-bg-premium flex items-center justify-center">
        <div className="text-white text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    const next = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/login?next=${next}`} replace />;
  }

  if (!user.bot_shield_verified && needsVerification(location.pathname)) {
    return <UnverifiedGate />;
  }

  return <Outlet />;
}
