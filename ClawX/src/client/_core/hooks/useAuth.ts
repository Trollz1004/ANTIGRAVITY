import { trpc } from '@/lib/trpc';
import { useCallback } from 'react';

export interface AuthUser {
  id: number;
  email: string;
  name: string | null;
  picture: string | null;
}

export function useAuth() {
  const { data: user, isLoading: loading } = trpc.auth.me.useQuery();
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      window.location.href = '/';
    },
  });

  const logout = useCallback(() => {
    logoutMutation.mutate();
  }, [logoutMutation]);

  return {
    user: user ?? null,
    loading,
    isAuthenticated: !!user,
    logout,
  };
}
