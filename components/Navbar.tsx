'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthContext } from '@/app/providers';
import NotificationBell from './NotificationBell';

export default function Navbar() {
  const { user, logout } = useAuthContext();
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => { logout(); router.push('/login'); };

  const navLink = (href: string, label: string) => (
    <Link href={href} className={`transition-colors ${pathname === href ? 'text-white font-medium' : 'text-zinc-500 hover:text-white'}`}>
      {label}
    </Link>
  );

  return (
    <nav className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-sm sticky top-0 z-10"
      style={{ paddingTop: 'env(safe-area-inset-top)' }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-green-400 font-bold text-lg tracking-tight select-none">CourtTrack</Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6 text-sm">
          {navLink('/', 'Dashboard')}
          {navLink('/leaderboard', 'Leaderboard')}
          {navLink('/groups', 'Groups')}
          <Link href="/log" className="bg-green-500 hover:bg-green-400 text-black font-semibold px-3 py-1.5 rounded-md transition-colors text-xs">
            + Log Match
          </Link>
          <NotificationBell />
          <Link href={`/profile/${user?.id}`} className="text-slate-300 hover:text-white transition-colors">{user?.username}</Link>
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 transition-colors text-xs">Sign out</button>
        </div>

        {/* Mobile: bell + sign out */}
        <div className="flex md:hidden items-center gap-3">
          <NotificationBell />
          <button onClick={handleLogout} className="text-slate-500 hover:text-red-400 text-xs">Sign out</button>
        </div>
      </div>
    </nav>
  );
}
