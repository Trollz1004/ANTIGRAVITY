import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

/**
 * Valid beta tester access codes.
 * Add codes here for people you want to grant instant app access.
 * They enter the code on the landing page or login page — no account needed.
 */
const BETA_CODES = new Set([
  'FORTHEKIDS',        // Primary beta code
  'JOKER0001',         // Josh's personal code
  'TWINPOWER',         // Twin brother code
]);

/** Check if a valid beta code is stored */
function hasBetaAccess(): boolean {
  const code = localStorage.getItem('beta_access_code');
  return code ? BETA_CODES.has(code.toUpperCase().trim()) : false;
}

/** Synthetic guest user for beta testers */
const BETA_USER = {
  user_id: 'beta-tester',
  email: 'beta@youandinotai.com',
  display_name: 'Beta Tester',
  bot_shield_verified: true,
  subscription_tier: 'founder',
  subscription_active: true,
  has_profile: false,
  adult_verified: true,
};

export { BETA_CODES, hasBetaAccess };

export function AuthGuard() {
  const { user, loading, fetchUser } = useAuth();
  const location = useLocation();
  const betaAccess = hasBetaAccess();

  useEffect(() => {
    if (!betaAccess) {
      fetchUser();
    }
  }, [fetchUser, betaAccess]);

  // Beta code bypass — instant access, no backend auth needed
  if (betaAccess) {
    // Set a synthetic user in the store if not already set
    if (!user) {
      useAuth.setState({ user: BETA_USER as any, loading: false });
    }
    return <Outlet />;
  }

  if (loading) {
    return (
      <div className="min-h-screen app-bg-premium flex items-center justify-center">
        <div className="text-white text-lg animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

