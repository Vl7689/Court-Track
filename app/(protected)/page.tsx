'use client';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthContext } from '@/app/providers';
import MatchCard from '@/components/MatchCard';
import type { PlayerStats, Match } from '@/types';

export default function DashboardPage() {
  const { user } = useAuthContext();
  const qc = useQueryClient();

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

  const { data: pending } = useQuery<Match[]>({
    queryKey: ['matches', 'pending'],
    queryFn: () => api.get('/matches/pending').then(r => r.data as Match[]),
    enabled: !!user,
  });

  const confirmMutation = useMutation({
    mutationFn: ({ id, action }: { id: number; action: 'confirmed' | 'disputed' }) =>
      api.post(`/matches/${id}/confirm`, { action }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['matches'] });
      qc.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  const s = statsData?.stats;
  const winRate = s ? `${s.winRate}%` : '—';
  const record = s ? `${s.wins}W ${s.losses}L` : '—';
  const streak = s?.currentStreak && s.streakType
    ? `${s.currentStreak} ${s.streakType === 'W' ? 'Win' : 'Loss'} streak`
    : '—';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-xl font-bold">
          Hey, <span className="text-green-400">{user?.username}</span> 👋
        </h2>
        <p className="text-slate-400 text-sm mt-0.5">Here's your snapshot.</p>
      </div>

      {/* Quick stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{s?.wins ?? '—'}</p>
          <p className="text-xs text-slate-400 mt-0.5">Wins</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold">{winRate}</p>
          <p className="text-xs text-slate-400 mt-0.5">Win rate</p>
        </div>
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 text-center">
          <p className="text-2xl font-bold">{s?.currentStreak ?? '—'}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {s?.streakType ? `${s.streakType === 'W' ? 'Win' : 'Loss'} streak` : 'Streak'}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Link href="/log" className="bg-green-500 hover:bg-green-400 active:scale-95 text-black font-bold py-4 rounded-2xl text-center transition-all">
          <span className="text-xl">+</span>
          <p className="text-sm mt-0.5">Log Match</p>
        </Link>
        <Link href={`/profile/${user?.id}`} className="bg-slate-800/60 border border-slate-700 hover:border-slate-600 active:scale-95 py-4 rounded-2xl text-center transition-all">
          <span className="text-xl">📊</span>
          <p className="text-sm mt-0.5 text-slate-300">My Stats</p>
        </Link>
      </div>

      {/* Pending confirmations */}
      {(pending?.length ?? 0) > 0 && (
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            {pending!.length} match{pending!.length > 1 ? 'es' : ''} waiting for your confirmation
          </h3>
          <div className="space-y-2">
            {pending!.map(m => {
              const team1 = [m.t1p1.username, m.t1p2?.username].filter(Boolean).join(' & ');
              const team2 = [m.t2p1.username, m.t2p2?.username].filter(Boolean).join(' & ');
              const scores = m.scores.map((s: { team1: number; team2: number }) => `${s.team1}-${s.team2}`).join(', ');
              return (
                <div key={m.id} className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3">
                  <p className="text-sm font-medium text-white mb-0.5">{team1} vs {team2}</p>
                  <p className="text-xs text-slate-400 mb-2">{m.sport.name} · {scores}</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmMutation.mutate({ id: m.id, action: 'confirmed' })}
                      disabled={confirmMutation.isPending}
                      className="flex-1 bg-green-500/20 border border-green-500/40 text-green-400 text-xs font-semibold py-1.5 rounded-lg transition-colors hover:bg-green-500/30"
                    >
                      ✓ Confirm
                    </button>
                    <button
                      onClick={() => confirmMutation.mutate({ id: m.id, action: 'disputed' })}
                      disabled={confirmMutation.isPending}
                      className="flex-1 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold py-1.5 rounded-lg transition-colors hover:bg-red-500/20"
                    >
                      ✗ Dispute
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent matches */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-300">Recent Matches</h3>
        <Link href="/leaderboard" className="text-xs text-green-400 hover:text-green-300 transition-colors">Rankings →</Link>
      </div>

      {matches?.length === 0 && (
        <div className="text-center py-14 text-slate-500 border border-dashed border-slate-700 rounded-2xl">
          <p className="text-3xl mb-2">🎾</p>
          <p className="mb-3 text-sm">No matches yet.</p>
          <Link href="/log" className="text-green-400 hover:text-green-300 text-sm font-medium">Log your first match →</Link>
        </div>
      )}
      <div className="space-y-2.5">
        {matches?.map(m => <MatchCard key={m.id} match={m} currentUserId={user?.id} />)}
      </div>
      {(matches?.length ?? 0) > 0 && (
        <div className="mt-4 text-center">
          <Link href={`/profile/${user?.id}`} className="text-xs text-slate-500 hover:text-white transition-colors">
            View full history →
          </Link>
        </div>
      )}
    </div>
  );
}
