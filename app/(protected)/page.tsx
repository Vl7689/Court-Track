'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthContext } from '@/app/providers';
import StatCard from '@/components/StatCard';
import MatchCard from '@/components/MatchCard';
import type { PlayerStats, Match } from '@/types';

export default function DashboardPage() {
  const { user } = useAuthContext();

  const { data: statsData } = useQuery<PlayerStats>({
    queryKey: ['stats', user?.id],
    queryFn: () => api.get(`/stats/${user?.id}`).then(r => r.data as PlayerStats),
    enabled: !!user,
  });

  const { data: matches } = useQuery<Match[]>({
    queryKey: ['matches', 'recent'],
    queryFn: () => api.get('/matches?limit=5').then(r => r.data as Match[]),
    enabled: !!user,
  });

  const s = statsData?.stats;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">
            Welcome back, <span className="text-green-400">{user?.username}</span>
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">Here's your performance overview.</p>
        </div>
        <Link href="/log" className="bg-green-500 hover:bg-green-400 text-black font-semibold px-4 py-2 rounded-lg transition-colors text-sm">
          + Log Match
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Wins" value={s?.wins ?? '—'} accent />
        <StatCard label="Total Losses" value={s?.losses ?? '—'} />
        <StatCard label="Win Rate" value={s != null ? `${s.winRate}%` : '—'} accent />
        <StatCard label="Current Streak" value={s?.currentStreak ?? '—'} sub={s?.streakType ? `${s.streakType === 'W' ? 'Win' : 'Loss'} streak` : undefined} />
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Recent Matches</h3>
        <Link href="/leaderboard" className="text-sm text-green-400 hover:text-green-300 transition-colors">View leaderboard →</Link>
      </div>

      {matches?.length === 0 && (
        <div className="text-center py-16 text-slate-500 border border-dashed border-slate-700 rounded-xl">
          <p className="mb-2">No matches yet.</p>
          <Link href="/log" className="text-green-400 hover:text-green-300 text-sm">Log your first match →</Link>
        </div>
      )}
      <div className="space-y-3">
        {matches?.map(m => <MatchCard key={m.id} match={m} currentUserId={user?.id} />)}
      </div>
      {(matches?.length ?? 0) > 0 && (
        <div className="mt-4 text-center">
          <Link href={`/profile/${user?.id}`} className="text-sm text-slate-400 hover:text-white transition-colors">
            View full match history →
          </Link>
        </div>
      )}
    </div>
  );
}
