import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

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

  return <Outlet />;
}
