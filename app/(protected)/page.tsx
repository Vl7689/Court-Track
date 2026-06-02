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
    queryFn: () => api.get('/matches?limit=8').then(r => r.data as Match[]),
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
  const hasStreak = s && s.currentStreak > 1 && s.streakType;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

      {/* Hero — record */}
      <div className="hero-gradient rounded-2xl px-5 pt-6 pb-5">
        <p className="text-xs text-zinc-500 font-medium mb-4 tracking-wide">
          {user?.username?.toUpperCase()}
        </p>
        <div className="flex items-end gap-5 mb-3">
          <div>
            <p className="text-7xl font-black text-white leading-none tabular-nums">{s?.wins ?? '–'}</p>
            <p className="text-xs text-zinc-500 mt-1.5 font-medium">WINS</p>
          </div>
          <p className="text-3xl text-zinc-700 font-light mb-3">·</p>
          <div>
            <p className="text-7xl font-black text-zinc-600 leading-none tabular-nums">{s?.losses ?? '–'}</p>
            <p className="text-xs text-zinc-500 mt-1.5 font-medium">LOSSES</p>
          </div>
          {s && s.total > 0 && (
            <>
              <p className="text-3xl text-zinc-700 font-light mb-3">·</p>
              <div>
                <p className="text-7xl font-black text-green-400 leading-none tabular-nums">{s.winRate}<span className="text-3xl">%</span></p>
                <p className="text-xs text-zinc-500 mt-1.5 font-medium">WIN RATE</p>
              </div>
            </>
          )}
        </div>
        {hasStreak && (
          <div className="inline-flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/25 px-3 py-1 rounded-full">
            <span className="text-sm">🔥</span>
            <span className="text-xs font-semibold text-orange-300">
              {s!.currentStreak}-match {s!.streakType === 'W' ? 'win' : 'loss'} streak
            </span>
          </div>
        )}
      </div>

      {/* Log match */}
      <Link href="/log"
        className="flex items-center justify-between bg-green-500 hover:bg-green-400 active:scale-[0.98] text-black font-bold px-6 py-4 rounded-2xl transition-all glow-green">
        <span className="text-base">Log a match</span>
        <span className="text-xl font-light">+</span>
      </Link>

      {/* Pending confirmations */}
      {(pending?.length ?? 0) > 0 && (
        <div className="rounded-2xl bg-zinc-900 border border-amber-500/20 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <p className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
              {pending!.length} pending {pending!.length === 1 ? 'confirmation' : 'confirmations'}
            </p>
          </div>
          <div className="divide-y divide-zinc-800">
            {pending!.map(m => {
              const team1 = [m.t1p1.username, m.t1p2?.username].filter(Boolean).join(' & ');
              const team2 = [m.t2p1.username, m.t2p2?.username].filter(Boolean).join(' & ');
              const scores = m.scores.map((s: { team1: number; team2: number }) => `${s.team1}–${s.team2}`).join(', ');
              return (
                <div key={m.id} className="px-4 py-3">
                  <div className="flex items-baseline justify-between mb-2.5">
                    <p className="text-sm font-semibold text-zinc-100">{team1} <span className="text-zinc-600 font-normal">vs</span> {team2}</p>
                    <p className="text-xs text-zinc-600 ml-3 shrink-0">{m.sport.name} · {scores}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => confirmMutation.mutate({ id: m.id, action: 'confirmed' })}
                      disabled={confirmMutation.isPending}
                      className="flex-1 text-xs font-semibold py-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-colors">
                      Confirm
                    </button>
                    <button onClick={() => confirmMutation.mutate({ id: m.id, action: 'disputed' })}
                      disabled={confirmMutation.isPending}
                      className="flex-1 text-xs font-semibold py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-red-400 transition-colors">
                      Dispute
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent matches */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Recent matches</p>
          <Link href={`/profile/${user?.id}`} className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors">see all</Link>
        </div>

        {!matches || matches.length === 0 ? (
          <div className="text-center py-14 rounded-2xl border border-dashed border-zinc-800">
            <p className="text-zinc-600 text-sm">No matches logged yet.</p>
            <Link href="/log" className="text-green-400 text-sm hover:text-green-300 mt-2 inline-block font-medium">
              Log your first →
            </Link>
          </div>
        ) : (
          <div className="space-y-1.5">
            {matches.map(m => <MatchCard key={m.id} match={m} currentUserId={user?.id} />)}
          </div>
        )}
      </div>

    </div>
  );
}
