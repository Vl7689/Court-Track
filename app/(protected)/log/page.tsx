'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthContext } from '@/app/providers';
import PlayerCombobox from '@/components/PlayerCombobox';
import type { Sport, User } from '@/types';

interface ScoreRow { team1: string; team2: string }

export default function LogMatchPage() {
  const { user } = useAuthContext();
  const router = useRouter();
  const qc = useQueryClient();

  const [sportId, setSportId] = useState('');
  const [matchType, setMatchType] = useState<'singles' | 'doubles'>('singles');
  const [location, setLocation] = useState('');
  const [t1p1, setT1p1] = useState(user?.username ?? '');
  const [t1p2, setT1p2] = useState('');
  const [t2p1, setT2p1] = useState('');
  const [t2p2, setT2p2] = useState('');
  const [scores, setScores] = useState<ScoreRow[]>([{ team1: '', team2: '' }]);
  const [winnerTeam, setWinnerTeam] = useState<1 | 2>(1);
  const [error, setError] = useState('');

  const { data: sports } = useQuery<Sport[]>({ queryKey: ['sports'], queryFn: () => api.get('/sports').then(r => r.data as Sport[]) });
  const { data: users } = useQuery<User[]>({ queryKey: ['users'], queryFn: () => api.get('/auth/users').then(r => r.data as User[]) });

  const resolveId = (u: string) => users?.find(x => x.username.toLowerCase() === u.trim().toLowerCase())?.id ?? null;

  const mutation = useMutation({
    mutationFn: (body: object) => api.post('/matches', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['matches'] }); qc.invalidateQueries({ queryKey: ['stats'] }); router.push('/'); },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(typeof msg === 'string' ? msg : 'Failed to log match. Check player usernames.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError('');
    const t1p1Id = resolveId(t1p1), t2p1Id = resolveId(t2p1);
    if (!t1p1Id) { setError(`Player not found: "${t1p1}"`); return; }
    if (!t2p1Id) { setError(`Player not found: "${t2p1}"`); return; }
    let t1p2Id: number | undefined, t2p2Id: number | undefined;
    if (matchType === 'doubles') {
      t1p2Id = resolveId(t1p2) ?? undefined;
      t2p2Id = resolveId(t2p2) ?? undefined;
      if (!t1p2Id) { setError(`Player not found: "${t1p2}"`); return; }
      if (!t2p2Id) { setError(`Player not found: "${t2p2}"`); return; }
    }
    const parsedScores = scores.map(s => ({ team1: parseInt(s.team1, 10), team2: parseInt(s.team2, 10) }));
    if (parsedScores.some(s => isNaN(s.team1) || isNaN(s.team2))) { setError('All score fields must be numbers'); return; }
    mutation.mutate({ sportId: Number(sportId), matchType, location: location.trim() || undefined, t1p1Id, t1p2Id, t2p1Id, t2p2Id, scores: parsedScores, winnerTeam });
  };

  const inp = 'w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-green-500 transition-colors text-sm';
  const lbl = 'text-xs text-slate-400 uppercase tracking-wide block mb-1.5';

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-1">Log a Match</h2>
      <p className="text-slate-400 text-sm mb-6">Type a name to search registered players.</p>
      <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={lbl}>Sport</label>
            <select value={sportId} onChange={e => setSportId(e.target.value)} className={inp} required>
              <option value="">Select sport...</option>
              {sports?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className={lbl}>Format</label>
            <div className="flex gap-2 mt-1">
              {(['singles', 'doubles'] as const).map(t => (
                <button key={t} type="button" onClick={() => setMatchType(t)}
                  className={`flex-1 py-1.5 rounded-lg border text-xs font-medium capitalize transition-colors ${matchType === t ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-slate-900 border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <label className={lbl}>Location (optional)</label>
          <input type="text" value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Downtown Rec Center" className={inp} />
        </div>

        <div className="grid grid-cols-2 gap-6">
          {[
            { label: 'Team 1', color: 'text-green-400', p1: t1p1, setP1: setT1p1, p2: t1p2, setP2: setT1p2 },
            { label: 'Team 2', color: 'text-slate-300', p1: t2p1, setP1: setT2p1, p2: t2p2, setP2: setT2p2 },
          ].map(({ label, color, p1, setP1, p2, setP2 }) => (
            <div key={label} className="space-y-3">
              <p className={`text-xs font-semibold uppercase tracking-wide ${color}`}>{label}</p>
              <div>
                <label className={lbl}>Player 1</label>
                <PlayerCombobox users={users ?? []} value={p1} onChange={setP1} placeholder="Search username..." required />
              </div>
              {matchType === 'doubles' && (
                <div>
                  <label className={lbl}>Player 2</label>
                  <PlayerCombobox users={users ?? []} value={p2} onChange={setP2} placeholder="Search username..." required />
                </div>
              )}
            </div>
          ))}
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-300">Scores</p>
            <button type="button" onClick={() => setScores([...scores, { team1: '', team2: '' }])} className="text-xs text-green-400 hover:text-green-300 transition-colors">+ Add set</button>
          </div>
          <div className="space-y-2">
            <div className="grid grid-cols-[3rem_1fr_1.5rem_1fr_1.5rem] gap-2 text-xs text-slate-500 px-1 mb-1">
              <span /><span className="text-center text-green-400">Team 1</span><span /><span className="text-center text-slate-300">Team 2</span><span />
            </div>
            {scores.map((s, i) => (
              <div key={i} className="grid grid-cols-[3rem_1fr_1.5rem_1fr_1.5rem] gap-2 items-center">
                <span className="text-slate-500 text-xs text-right">Set {i + 1}</span>
                {(['team1', 'team2'] as const).map((field, fi) => (
                  fi === 1 ? [
                    <span key="dash" className="text-slate-500 text-center">–</span>,
                    <input key="t2" type="number" min="0" max="99" value={s[field]} onChange={e => setScores(scores.map((x, j) => j === i ? { ...x, [field]: e.target.value } : x))} className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-green-500 text-center text-sm w-full" required />
                  ] : [
                    <input key="t1" type="number" min="0" max="99" value={s[field]} onChange={e => setScores(scores.map((x, j) => j === i ? { ...x, [field]: e.target.value } : x))} className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-white focus:outline-none focus:border-green-500 text-center text-sm w-full" required />
                  ]
                ))}
                {scores.length > 1
                  ? <button type="button" onClick={() => setScores(scores.filter((_, j) => j !== i))} className="text-slate-600 hover:text-red-400 text-sm transition-colors">✕</button>
                  : <span />}
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-300 mb-2">Winner</p>
          <div className="flex gap-3">
            {([1, 2] as const).map(t => (
              <button key={t} type="button" onClick={() => setWinnerTeam(t)}
                className={`flex-1 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${winnerTeam === t ? 'bg-green-500/20 border-green-500 text-green-400' : 'bg-slate-900 border-slate-600 text-slate-400 hover:border-slate-500'}`}>
                Team {t} wins
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
        <button type="submit" disabled={mutation.isPending} className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-2.5 rounded-lg transition-colors">
          {mutation.isPending ? 'Saving...' : 'Log Match'}
        </button>
      </form>
    </div>
  );
}
