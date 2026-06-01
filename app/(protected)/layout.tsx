'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuthContext } from '@/app/providers';
import Navbar from '@/components/Navbar';
import BottomNav from '@/components/BottomNav';
import { api } from '@/lib/api';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import type { Match } from '@/types';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    if (!localStorage.getItem('token')) router.push('/login');
  }, [router]);

  useEffect(() => {
    if (ready && !user) router.push('/login');
  }, [ready, user, router]);

  usePushNotifications();

  const { data: pending } = useQuery<Match[]>({
    queryKey: ['matches', 'pending'],
    queryFn: () => api.get('/matches/pending').then(r => r.data as Match[]),
    enabled: !!user && ready,
  });

  if (!ready || !user) return null;

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <Navbar />
      {children}
      <BottomNav pendingCount={pending?.length} />
    </div>
  );
}
