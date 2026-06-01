'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthContext } from '@/app/providers';

export default function BottomNav({ pendingCount }: { pendingCount?: number }) {
  const { user } = useAuthContext();
  const pathname = usePathname();

  const active = (href: string) =>
    pathname === href ? 'text-green-400' : 'text-slate-500';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 md:hidden bg-slate-900 border-t border-slate-800 pb-safe">
      <div className="flex items-end h-16">
        {/* Home */}
        <Link href="/" className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 ${active('/')}`}>
          <svg viewBox="0 0 24 24" fill={pathname === '/' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
          </svg>
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        {/* Leaderboard */}
        <Link href="/leaderboard" className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 ${active('/leaderboard')}`}>
          <svg viewBox="0 0 24 24" fill={pathname === '/leaderboard' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 012.916.52 6.003 6.003 0 01-5.395 4.972m0 0a6.726 6.726 0 01-2.749 1.35m0 0a6.772 6.772 0 01-3.044 0" />
          </svg>
          <span className="text-[10px] font-medium">Rankings</span>
        </Link>

        {/* Log match — center FAB */}
        <div className="flex-1 flex flex-col items-center justify-center -mt-5">
          <Link href="/log" className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center shadow-lg shadow-green-500/30 active:scale-95 transition-transform">
            <svg viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth={2.5} className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
          </Link>
          <span className="text-[10px] text-slate-500 mt-1">Log</span>
        </div>

        {/* Groups */}
        <Link href="/groups" className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 ${active('/groups')}`}>
          <svg viewBox="0 0 24 24" fill={pathname === '/groups' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <span className="text-[10px] font-medium">Groups</span>
        </Link>

        {/* Profile */}
        <Link href={`/profile/${user?.id}`} className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 relative ${pathname.startsWith('/profile') ? 'text-green-400' : 'text-slate-500'}`}>
          {(pendingCount ?? 0) > 0 && (
            <span className="absolute top-1.5 right-4 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {pendingCount}
            </span>
          )}
          <svg viewBox="0 0 24 24" fill={pathname.startsWith('/profile') ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.8} className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
