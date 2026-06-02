import type { Match } from '@/types';

function fmt(scores: { team1: number; team2: number }[]): string {
  return scores.map(s => `${s.team1}–${s.team2}`).join('  ');
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function MatchCard({ match, currentUserId }: { match: Match; currentUserId?: number }) {
  const onTeam1 = currentUserId != null && (match.t1p1.id === currentUserId || match.t1p2?.id === currentUserId);
  const onTeam2 = currentUserId != null && (match.t2p1.id === currentUserId || match.t2p2?.id === currentUserId);
  const participated = onTeam1 || onTeam2;
  const won = participated && ((onTeam1 && match.winnerTeam === 1) || (onTeam2 && match.winnerTeam === 2));
  const lost = participated && !won;

  const team1 = [match.t1p1.username, match.t1p2?.username].filter(Boolean).join(' & ');
  const team2 = [match.t2p1.username, match.t2p2?.username].filter(Boolean).join(' & ');

  const accentColor = participated
    ? won ? 'border-l-green-500' : 'border-l-red-500'
    : 'border-l-slate-700';

  return (
    <div className={`border-l-[3px] ${accentColor} bg-slate-900 rounded-r-xl px-4 py-3`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">{match.sport.name}</span>
          <span className="text-slate-700">·</span>
          <span className="text-xs text-slate-600 capitalize">{match.matchType}</span>
        </div>
        <div className="flex items-center gap-2">
          {participated && (
            <span className={`text-xs font-bold tracking-wide ${won ? 'text-green-400' : 'text-red-400'}`}>
              {won ? 'W' : 'L'}
            </span>
          )}
          <span className="text-xs text-slate-600">{timeAgo(match.playedAt)}</span>
        </div>
      </div>

      <div className="flex items-baseline gap-3">
        <span className={`flex-1 text-sm font-semibold truncate ${match.winnerTeam === 1 ? 'text-white' : 'text-slate-500'}`}>
          {team1}
        </span>
        <span className="font-mono text-sm text-slate-300 shrink-0 tabular-nums">{fmt(match.scores)}</span>
        <span className={`flex-1 text-sm font-semibold truncate text-right ${match.winnerTeam === 2 ? 'text-white' : 'text-slate-500'}`}>
          {team2}
        </span>
      </div>

      {match.location && (
        <p className="text-xs text-slate-600 mt-1.5">{match.location}</p>
      )}
    </div>
  );
}
