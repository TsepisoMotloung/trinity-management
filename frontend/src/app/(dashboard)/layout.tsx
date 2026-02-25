'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Sidebar } from '@/components/layout/sidebar';
import { NotificationBell } from '@/components/layout/notification-bell';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, fetchCurrentUser } = useAuthStore();
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  useEffect(() => {
    // Only check auth once on mount
    if (!hasCheckedAuth) {
      const checkAuth = async () => {
        await fetchCurrentUser();
        setHasCheckedAuth(true);
      };
      checkAuth();
    }
  }, [hasCheckedAuth, fetchCurrentUser]);

  useEffect(() => {
    // Only redirect if we've checked auth and user is not authenticated
    if (hasCheckedAuth && !isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router, hasCheckedAuth]);

  if (!hasCheckedAuth || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="md:pl-64">
        <div className="flex justify-end px-6 pt-4 md:px-8">
          <NotificationBell />
        </div>
        <div className="px-6 pb-6 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
