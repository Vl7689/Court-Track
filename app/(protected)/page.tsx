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
  const streakLabel = s?.currentStreak && s.streakType
    ? `${s.currentStreak} ${s.streakType === 'W' ? 'win' : 'loss'} streak`
    : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-8">

      {/* Hero record */}
      <div>
        <p className="text-slate-500 text-sm mb-1">Hey, {user?.username}</p>
        <div className="flex items-end gap-4">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-black text-white tabular-nums leading-none">{s?.wins ?? '–'}</span>
              <span className="text-2xl text-slate-600 font-light">–</span>
              <span className="text-6xl font-black text-slate-500 tabular-nums leading-none">{s?.losses ?? '–'}</span>
            </div>
            <p className="text-slate-600 text-xs mt-1.5">wins · losses</p>
          </div>
          <div className="mb-1 flex flex-col gap-1.5">
            {s && s.total > 0 && (
              <span className="text-sm font-semibold text-slate-300">{s.winRate}% win rate</span>
            )}
            {streakLabel && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${s?.streakType === 'W' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                {streakLabel}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Log match CTA */}
      <Link href="/log"
        className="flex items-center justify-between w-full bg-green-500 hover:bg-green-400 active:scale-[0.98] text-black font-bold px-5 py-4 rounded-2xl transition-all">
        <span>Log a match</span>
        <span className="text-xl">+</span>
      </Link>

      {/* Pending confirmations */}
      {(pending?.length ?? 0) > 0 && (
        <div>
          <p className="text-xs font-semibold text-amber-400 mb-3 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {pending!.length} pending confirmation{pending!.length > 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {pending!.map(m => {
              const team1 = [m.t1p1.username, m.t1p2?.username].filter(Boolean).join(' & ');
              const team2 = [m.t2p1.username, m.t2p2?.username].filter(Boolean).join(' & ');
              const scores = m.scores.map((s: { team1: number; team2: number }) => `${s.team1}-${s.team2}`).join(', ');
              return (
                <div key={m.id} className="bg-amber-500/8 border border-amber-500/20 rounded-xl p-3.5">
                  <p className="text-sm font-medium text-white">{team1} vs {team2}</p>
                  <p className="text-xs text-slate-500 mt-0.5 mb-3">{m.sport.name} · {scores}</p>
                  <div className="flex gap-2">
                    <button onClick={() => confirmMutation.mutate({ id: m.id, action: 'confirmed' })}
                      disabled={confirmMutation.isPending}
                      className="flex-1 bg-slate-800 hover:bg-green-500/20 border border-slate-700 hover:border-green-500/40 text-slate-300 hover:text-green-400 text-xs font-semibold py-2 rounded-lg transition-colors">
                      Confirm
                    </button>
                    <button onClick={() => confirmMutation.mutate({ id: m.id, action: 'disputed' })}
                      disabled={confirmMutation.isPending}
                      className="flex-1 bg-slate-800 hover:bg-red-500/10 border border-slate-700 hover:border-red-500/30 text-slate-500 hover:text-red-400 text-xs font-semibold py-2 rounded-lg transition-colors">
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
          <p className="text-sm font-semibold text-slate-300">Recent matches</p>
          <Link href={`/profile/${user?.id}`} className="text-xs text-slate-500 hover:text-slate-300 transition-colors">see all</Link>
        </div>

        {!matches || matches.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-800 rounded-2xl">
            <p className="text-slate-600 text-sm">No matches yet.</p>
            <Link href="/log" className="text-green-400 text-sm hover:text-green-300 mt-1 inline-block">Log your first →</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {matches.map(m => <MatchCard key={m.id} match={m} currentUserId={user?.id} />)}
          </div>
        )}
      </div>

    </div>
  );
}
