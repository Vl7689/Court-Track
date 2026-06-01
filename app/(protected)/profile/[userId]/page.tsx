'use client';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthContext } from '@/app/providers';
import StatCard from '@/components/StatCard';
import MatchCard from '@/components/MatchCard';
import type { PlayerStats } from '@/types';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <div><h3 className="text-base font-semibold text-slate-200 mb-3">{title}</h3>{children}</div>;
}

function Mini({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-center">
      <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-bold ${color ?? 'text-white'}`}>{value}</p>
      {sub && <p className="text-slate-500 text-xs mt-0.5">{sub}</p>}
    </div>
  );
}

function WR({ rate }: { rate: number }) {
  return <span className={`font-semibold ${rate >= 60 ? 'text-green-400' : rate >= 40 ? 'text-slate-300' : 'text-red-400'}`}>{rate}%</span>;
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-2xl overflow-x-auto">
      <table className="w-full min-w-[320px]">
        <thead><tr className="border-b border-slate-700">
          {headers.map((h, i) => <th key={h} className={`px-4 py-3 text-xs text-slate-400 uppercase tracking-wide whitespace-nowrap ${i === 0 ? 'text-left' : 'text-right'}`}>{h}</th>)}
        </tr></thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b border-slate-700/40 last:border-0 hover:bg-slate-700/20 transition-colors">
              {row.map((cell, j) => <td key={j} className={`px-4 py-3 text-sm ${j === 0 ? 'text-left' : 'text-right'}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormBadge({ winRate, overall }: { winRate: number; overall: number }) {
  if (!overall) return null;
  const d = winRate - overall;
  if (d >= 15) return <span className="text-xs font-semibold text-green-400 ml-1">Hot</span>;
  if (d <= -15) return <span className="text-xs font-semibold text-red-400 ml-1">Cold</span>;
  return <span className="text-xs text-slate-500 ml-1">Steady</span>;
}

export default function ProfilePage({ params }: { params: { userId: string } }) {
  const { user: me } = useAuthContext();
  const userId = params.userId;

  const { data: profile, isLoading } = useQuery<PlayerStats>({
    queryKey: ['stats', userId],
    queryFn: () => api.get(`/stats/${userId}`).then(r => r.data as PlayerStats),
    enabled: !!userId,
  });

  if (isLoading) return <div className="flex items-center justify-center py-24 text-slate-400">Loading...</div>;
  if (!profile) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-center px-4">
      <p className="text-4xl">👤</p>
      <p className="text-slate-300 font-semibold">Player not found</p>
      <p className="text-slate-500 text-sm">This account may have been removed.</p>
    </div>
  );

  const isMe = me?.id === Number(userId);
  const { stats, headToHead, nemesis, bestVictim, locationStats, partnerStats, sportBreakdown, formatBreakdown, dayOfWeek, setStats, momentum, highlights, formTrend, recentMatches } = profile;
  const winBar = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;
  const margin = setStats.avgScoreFor - setStats.avgScoreAgainst;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{profile.user.username}{isMe && <span className="ml-2 text-sm text-slate-400 font-normal">(you)</span>}</h2>
          <p className="text-slate-500 text-sm mt-0.5">Member since {new Date(profile.user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}</p>
        </div>
        {stats.total > 0 && (
          <div className="text-right shrink-0">
            <p className="text-xs text-slate-400 mb-1">{stats.wins}W – {stats.losses}L</p>
            <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: `${winBar}%` }} />
            </div>
          </div>
        )}
      </div>

      {stats.total === 0 && (
        <div className="text-center py-12 border border-dashed border-slate-700 rounded-2xl">
          <p className="text-4xl mb-3">🎾</p>
          <p className="text-slate-300 font-semibold">{isMe ? 'You haven\'t logged any matches yet' : 'No matches logged yet'}</p>
          <p className="text-slate-500 text-sm mt-1">{isMe ? 'Log your first match to start tracking stats.' : 'Stats will appear once matches are logged.'}</p>
          {isMe && <Link href="/log" className="inline-block mt-4 bg-green-500 text-black font-semibold px-4 py-2 rounded-xl text-sm">Log a Match</Link>}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Wins" value={stats.wins} accent />
        <StatCard label="Losses" value={stats.losses} />
        <StatCard label="Win Rate" value={`${stats.winRate}%`} accent />
        <StatCard label="Best Streak" value={stats.maxStreak} sub={stats.currentStreak > 0 ? `Current: ${stats.currentStreak} ${stats.streakType === 'W' ? 'wins' : 'losses'}` : 'No active streak'} />
      </div>

      {stats.total > 0 && (<>
        <Section title="Form Trend">
          <div className="grid grid-cols-3 gap-3">
            {[{ label: 'Last 5', data: formTrend.last5 }, { label: 'Last 10', data: formTrend.last10 }, { label: 'All Time', data: formTrend.overall }].map(({ label, data }) => (
              <div key={label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-4 text-center">
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">{label}</p>
                <p className="text-2xl font-bold text-white inline-flex items-baseline gap-1">
                  {data.winRate}%{label !== 'All Time' && <FormBadge winRate={data.winRate} overall={formTrend.overall.winRate} />}
                </p>
                <p className="text-slate-500 text-xs mt-0.5">{data.wins}W – {data.matches - data.wins}L{data.matches < (label === 'Last 5' ? 5 : 10) && label !== 'All Time' ? ` (${data.matches} played)` : ''}</p>
              </div>
            ))}
          </div>
        </Section>

        {(nemesis || bestVictim) && (
          <Section title="Rivalries">
            <div className="grid grid-cols-2 gap-4">
              {nemesis ? (
                <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5">
                  <p className="text-red-400 text-xs font-semibold uppercase tracking-wide mb-1">Your Nemesis</p>
                  <Link href={`/profile/${nemesis.opponent.id}`} className="text-lg font-bold text-white hover:text-red-400 transition-colors">{nemesis.opponent.username}</Link>
                  <p className="text-slate-400 text-sm mt-1">{nemesis.wins}W – {nemesis.losses}L · <span className="text-red-400">{nemesis.winRate}%</span></p>
                  <p className="text-slate-500 text-xs mt-1">Can't seem to crack this one.</p>
                </div>
              ) : <div />}
              {bestVictim ? (
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-5">
                  <p className="text-green-400 text-xs font-semibold uppercase tracking-wide mb-1">Favorite Victim</p>
                  <Link href={`/profile/${bestVictim.opponent.id}`} className="text-lg font-bold text-white hover:text-green-400 transition-colors">{bestVictim.opponent.username}</Link>
                  <p className="text-slate-400 text-sm mt-1">{bestVictim.wins}W – {bestVictim.losses}L · <span className="text-green-400">{bestVictim.winRate}%</span></p>
                  <p className="text-slate-500 text-xs mt-1">Practically a free win.</p>
                </div>
              ) : <div />}
            </div>
          </Section>
        )}

        {(momentum.afterWin.total > 0 || momentum.afterLoss.total > 0 || setStats.clutchGames > 0) && (
          <Section title="Mental Game">
            <div className="grid grid-cols-3 gap-3">
              {setStats.clutchGames > 0 && <Mini label="Clutch Rate" value={`${setStats.clutchRate}%`} sub={`deciding sets (${setStats.clutchGames} games)`} color={setStats.clutchRate >= 50 ? 'text-green-400' : 'text-red-400'} />}
              {momentum.afterWin.total > 0 && <Mini label="After a Win" value={`${momentum.afterWin.winRate}%`} sub={`${momentum.afterWin.wins}W–${momentum.afterWin.losses}L next match`} color={momentum.afterWin.winRate >= 60 ? 'text-green-400' : 'text-white'} />}
              {momentum.afterLoss.total > 0 && <Mini label="Bounce-Back" value={`${momentum.afterLoss.winRate}%`} sub={`${momentum.afterLoss.wins}W–${momentum.afterLoss.losses}L after a loss`} color={momentum.afterLoss.winRate >= 50 ? 'text-green-400' : 'text-red-400'} />}
            </div>
            {momentum.afterWin.total > 0 && momentum.afterLoss.total > 0 && (
              <p className="text-slate-500 text-xs mt-3 text-center">
                {momentum.afterWin.winRate > momentum.afterLoss.winRate + 20 ? 'You ride momentum well — winning breeds winning for you.'
                  : momentum.afterLoss.winRate > momentum.afterWin.winRate + 20 ? 'You bounce back stronger after losses — adversity fuels you.'
                  : 'Consistent mental performance regardless of last result.'}
              </p>
            )}
          </Section>
        )}

        {setStats.totalSets > 0 && (
          <Section title="Set Analysis">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Mini label="Set Win Rate" value={`${setStats.setWinRate}%`} sub={`${setStats.setsWon}W – ${setStats.setsLost}L`} />
              <Mini label="Avg Score" value={`${setStats.avgScoreFor}–${setStats.avgScoreAgainst}`} sub="pts per set" />
              <Mini label="Close Sets ≤2 pts" value={setStats.closeSetWins + setStats.closeSetLosses} sub={`${setStats.closeSetWins}W ${setStats.closeSetLosses}L`} />
              <Mini label="Comebacks" value={setStats.comebackWins} sub={`${setStats.comebackLosses} blown leads`} />
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Mini label="First Set Win Rate" value={`${setStats.firstSetWinRate}%`} sub="does winning set 1 = winning match?" />
              <Mini label="Avg Point Margin" value={`${margin >= 0 ? '+' : ''}${Math.round(margin * 10) / 10}`} sub="per set — positive means you dominate" color={margin > 1 ? 'text-green-400' : margin < -1 ? 'text-red-400' : 'text-white'} />
            </div>
          </Section>
        )}

        {(highlights.biggestWin || highlights.closestWin) && (
          <Section title="Match Highlights">
            <div className="grid grid-cols-2 gap-4">
              {highlights.biggestWin && (
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                  <p className="text-green-400 text-xs font-semibold uppercase tracking-wide mb-2">Most Dominant Win</p>
                  <p className="font-semibold text-white">vs {highlights.biggestWin.opponent}</p>
                  <p className="text-slate-400 text-sm">{highlights.biggestWin.scoreStr}</p>
                  <p className="text-slate-500 text-xs mt-1">{highlights.biggestWin.sport} · +{highlights.biggestWin.margin} pts</p>
                </div>
              )}
              {highlights.closestWin && (
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                  <p className="text-yellow-400 text-xs font-semibold uppercase tracking-wide mb-2">Closest Win</p>
                  <p className="font-semibold text-white">vs {highlights.closestWin.opponent}</p>
                  <p className="text-slate-400 text-sm">{highlights.closestWin.scoreStr}</p>
                  <p className="text-slate-500 text-xs mt-1">{highlights.closestWin.sport} · +{highlights.closestWin.margin} pts</p>
                </div>
              )}
            </div>
          </Section>
        )}

        {sportBreakdown.length > 1 && (
          <Section title="By Sport">
            <Table headers={['Sport', 'W', 'L', 'Matches', 'Win%']} rows={sportBreakdown.map(s => [
              <span className="font-medium text-white">{s.sport.name}</span>,
              <span className="text-green-400 font-semibold">{s.wins}</span>,
              <span className="text-red-400">{s.losses}</span>,
              <span className="text-slate-400">{s.total}</span>,
              <WR rate={s.winRate} />,
            ])} />
          </Section>
        )}

        {formatBreakdown.singles.total > 0 && formatBreakdown.doubles.total > 0 && (
          <Section title="Singles vs Doubles">
            <div className="grid grid-cols-2 gap-4">
              {[{ label: 'Singles', data: formatBreakdown.singles }, { label: 'Doubles', data: formatBreakdown.doubles }].map(({ label, data }) => (
                <div key={label} className="bg-slate-800/60 border border-slate-700 rounded-xl p-5">
                  <p className="text-slate-400 text-xs uppercase tracking-wide mb-1">{label}</p>
                  <p className={`text-3xl font-bold ${data.winRate >= 50 ? 'text-green-400' : 'text-white'}`}>{data.winRate}%</p>
                  <p className="text-slate-500 text-sm mt-1">{data.wins}W – {data.losses}L in {data.total} matches</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {dayOfWeek.length > 1 && (
          <Section title="Best Day to Play">
            <Table headers={['Day', 'W', 'L', 'Matches', 'Win%']} rows={dayOfWeek.map(d => [
              <span className="font-medium text-white">{d.day}</span>,
              <span className="text-green-400 font-semibold">{d.wins}</span>,
              <span className="text-red-400">{d.losses}</span>,
              <span className="text-slate-400">{d.total}</span>,
              <WR rate={d.winRate} />,
            ])} />
          </Section>
        )}

        {headToHead.length > 0 && (
          <Section title="Head to Head">
            <Table headers={['Opponent', 'W', 'L', 'Matches', 'Win%']} rows={headToHead.map(h => [
              <Link href={`/profile/${h.opponent.id}`} className="font-medium text-white hover:text-green-400 transition-colors">{h.opponent.username}</Link>,
              <span className="text-green-400 font-semibold">{h.wins}</span>,
              <span className="text-red-400">{h.losses}</span>,
              <span className="text-slate-400">{h.total}</span>,
              <WR rate={h.winRate} />,
            ])} />
          </Section>
        )}

        {locationStats.length > 0 && (
          <Section title="Performance by Location">
            <Table headers={['Location', 'W', 'L', 'Win%']} rows={locationStats.map(l => [
              <span className="font-medium text-white">{l.location}</span>,
              <span className="text-green-400 font-semibold">{l.wins}</span>,
              <span className="text-red-400">{l.losses}</span>,
              <WR rate={l.winRate} />,
            ])} />
          </Section>
        )}

        {partnerStats.length > 0 && (
          <Section title="Doubles Partner Stats">
            <Table headers={['Partner', 'W', 'L', 'Matches', 'Win%']} rows={partnerStats.map(p => [
              <Link href={`/profile/${p.partner.id}`} className="font-medium text-white hover:text-green-400 transition-colors">{p.partner.username}</Link>,
              <span className="text-green-400 font-semibold">{p.wins}</span>,
              <span className="text-red-400">{p.losses}</span>,
              <span className="text-slate-400">{p.total}</span>,
              <WR rate={p.winRate} />,
            ])} />
          </Section>
        )}
      </>)}

      {recentMatches.length > 0 && (
        <Section title="Match History">
          <div className="space-y-2.5">{recentMatches.map(m => <MatchCard key={m.id} match={m} currentUserId={Number(userId)} />)}</div>
        </Section>
      )}
    </div>
  );
}
