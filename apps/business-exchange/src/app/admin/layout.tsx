'use client';

import { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AdminLayoutWrapperProps {
  children: ReactNode;
}

export default function AdminLayoutWrapper({ children }: AdminLayoutWrapperProps) {
  const router = useRouter();
  const [user, setUser] = useState<{ name?: string | null; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.user.role !== 'ADMIN') {
            router.push('/dashboard');
            return;
          }
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
    <div className="min-h-screen bg-nexus-50 dark:bg-nexus-950" data-theme="dark">
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        user={user}
        onLogout={handleLogout}
        isAdmin={true}
      />

      <div
        className={cn(
          'transition-all duration-200',
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
        <Header
          user={user}
          onLogout={handleLogout}
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={() => setMobileSidebarOpen(true)}
        />

        <main
          className={cn(
            'pt-16 min-h-screen transition-all duration-200',
            sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
          )}
          role="main"
        >
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}