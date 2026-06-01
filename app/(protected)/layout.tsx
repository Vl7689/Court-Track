'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/providers';
import Navbar from '@/components/Navbar';

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

  if (!ready || !user) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      {children}
    </div>
  );
}
