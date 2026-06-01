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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Leaderboard{activeGroup && <span className="ml-2 text-base font-normal text-slate-400">— {activeGroup.name}</span>}</h2>
          {myRank && (
            <p className="text-slate-400 text-sm mt-0.5">
              You're ranked <span className="text-green-400 font-semibold">#{myRank}</span>
              {board && <span className="text-slate-500"> out of {board.length.toLocaleString()} player{board.length !== 1 ? 's' : ''}</span>}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <select value={groupId} onChange={e => setGroupId(e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500">
            <option value="">All Players</option>
            {groups?.map(g => <option key={g.id} value={String(g.id)}>{g.name}</option>)}
          </select>
          <select value={sportSlug} onChange={e => setSportSlug(e.target.value)} className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-green-500">
            <option value="">All Sports</option>
            {sports?.map(s => <option key={s.slug} value={s.slug}>{s.name}</option>)}
          </select>
        </div>
      </div>
      <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-hidden">
        {isLoading ? <div className="py-16 text-center text-slate-500">Loading...</div> : (
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
              {board?.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-16 text-center text-slate-500">
                  No matches logged yet. {activeGroup ? 'Play some matches with your group first.' : 'Be the first!'}
                </td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
