'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthContext } from '@/app/providers';
import type { LeaderboardEntry, Sport, Group } from '@/types';

const MEDALS = ['🥇', '🥈', '🥉'];

export default function LeaderboardPage() {
  const { user } = useAuthContext();
  const searchParams = useSearchParams();
  const [sportSlug, setSportSlug] = useState('');
  const [groupId, setGroupId] = useState(searchParams.get('group') ?? '');

  useEffect(() => { const g = searchParams.get('group'); if (g) setGroupId(g); }, [searchParams]);

  const { data: sports } = useQuery<Sport[]>({ queryKey: ['sports'], queryFn: () => api.get('/sports').then(r => r.data as Sport[]) });
  const { data: groups } = useQuery<Group[]>({ queryKey: ['groups'], queryFn: () => api.get('/groups').then(r => r.data as Group[]) });
  const { data: board, isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ['leaderboard', sportSlug, groupId],
    queryFn: () => {
      const p = new URLSearchParams();
      if (sportSlug) p.set('sport', sportSlug);
      if (groupId) p.set('group', groupId);
      const qs = p.toString();
      return api.get(`/leaderboard${qs ? `?${qs}` : ''}`).then(r => r.data as LeaderboardEntry[]);
    },
  });

  const myRank = board?.find(e => e.id === user?.id)?.rank;
  const activeGroup = groups?.find(g => String(g.id) === groupId);

  const sel = 'bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-green-500 appearance-none w-full';

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold">
          {activeGroup ? activeGroup.name : 'Rankings'}
        </h2>
        {myRank && (
          <p className="text-slate-400 text-sm mt-0.5">
            You're <span className="text-green-400 font-semibold">#{myRank}</span>
            {board && <span className="text-slate-500"> of {board.length} player{board.length !== 1 ? 's' : ''}</span>}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        <select value={groupId} onChange={e => setGroupId(e.target.value)} className={sel}>
          <option value="">All Players</option>
          {groups?.map(g => <option key={g.id} value={String(g.id)}>{g.name}</option>)}
        </select>
        <select value={sportSlug} onChange={e => setSportSlug(e.target.value)} className={sel}>
          <option value="">All Sports</option>
          {sports?.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-slate-500">Loading...</div>
      ) : board?.length === 0 ? (
        <div className="text-center py-16 text-slate-500 border border-dashed border-slate-700 rounded-2xl">
          <p className="text-3xl mb-2">🏆</p>
          <p>{activeGroup ? 'No matches in this group yet.' : 'No matches logged yet — be the first!'}</p>
        </div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="md:hidden space-y-2">
            {board?.map(entry => (
              <Link key={entry.id} href={`/profile/${entry.id}`}
                className={`flex items-center gap-3 p-4 rounded-2xl border transition-colors ${entry.id === user?.id ? 'bg-green-500/5 border-green-500/30' : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'}`}>
                <div className="w-8 text-center shrink-0">
                  {entry.rank <= 3
                    ? <span className="text-xl">{MEDALS[entry.rank - 1]}</span>
                    : <span className="text-slate-500 font-semibold text-sm">#{entry.rank}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold truncate ${entry.id === user?.id ? 'text-green-400' : 'text-white'}`}>
                    {entry.username}{entry.id === user?.id && <span className="ml-1 text-xs text-slate-500">(you)</span>}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{entry.wins}W · {entry.losses}L · {entry.total} matches</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className={`text-lg font-bold ${entry.winRate >= 50 ? 'text-green-400' : 'text-slate-300'}`}>{entry.winRate}%</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  {['#', 'Player', 'W', 'L', 'Matches', 'Win%'].map((h, i) => (
                    <th key={h} className={`px-5 py-3 text-xs text-slate-400 uppercase tracking-wide ${i <= 1 ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {board?.map(entry => (
                  <tr key={entry.id} className={`border-b border-slate-700/40 hover:bg-slate-700/20 transition-colors ${entry.id === user?.id ? 'bg-green-500/5' : ''}`}>
                    <td className="px-5 py-3.5 text-sm">
                      {entry.rank <= 3 ? <span className="text-base">{MEDALS[entry.rank - 1]}</span> : <span className="text-slate-500">{entry.rank}</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <Link href={`/profile/${entry.id}`} className={`font-medium hover:text-green-400 transition-colors ${entry.id === user?.id ? 'text-green-400' : 'text-white'}`}>
                        {entry.username}{entry.id === user?.id && <span className="ml-2 text-xs text-slate-500">(you)</span>}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-right text-green-400 font-semibold text-sm">{entry.wins}</td>
                    <td className="px-5 py-3.5 text-right text-red-400 text-sm">{entry.losses}</td>
                    <td className="px-5 py-3.5 text-right text-slate-400 text-sm">{entry.total}</td>
                    <td className="px-5 py-3.5 text-right"><span className={`font-semibold text-sm ${entry.winRate >= 50 ? 'text-green-400' : 'text-slate-300'}`}>{entry.winRate}%</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
