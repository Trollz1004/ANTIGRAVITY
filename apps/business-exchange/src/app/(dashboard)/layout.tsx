'use client';

import { ReactNode } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface DashboardLayoutWrapperProps {
  children: ReactNode;
}

export default function DashboardLayoutWrapper({ children }: DashboardLayoutWrapperProps) {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string | null; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          router.push('/auth/login');
        }
      } catch {
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-nexus-50 dark:bg-nexus-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-hydra-600 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    router.push('/auth/login');
    router.refresh();
  };

  return (
    <DashboardLayout user={user} onLogout={handleLogout} isAdmin={user.role === 'ADMIN'}>
      {children}
    </DashboardLayout>
  );
}