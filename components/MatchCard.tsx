import type { Match } from '@/types';

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

  const team1 = [match.t1p1.username, match.t1p2?.username].filter(Boolean).join(' & ');
  const team2 = [match.t2p1.username, match.t2p2?.username].filter(Boolean).join(' & ');
  const scoreStr = match.scores.map(s => `${s.team1}–${s.team2}`).join('  ');

  return (
    <div className="rounded-xl overflow-hidden bg-zinc-900 hover:bg-zinc-800/80 transition-colors">
      {/* top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-bold tracking-widest uppercase px-1.5 py-0.5 rounded ${participated ? (won ? 'bg-green-500/20 text-green-400' : 'bg-red-500/15 text-red-400') : 'bg-zinc-800 text-zinc-500'}`}>
            {participated ? (won ? 'W' : 'L') : match.sport.name[0]}
          </span>
          <span className="text-xs text-zinc-500 font-medium">{match.sport.name}</span>
          <span className="text-zinc-700 text-xs">·</span>
          <span className="text-xs text-zinc-600 capitalize">{match.matchType}</span>
        </div>
        <span className="text-xs text-zinc-600">{timeAgo(match.playedAt)}</span>
      </div>

      {/* score row */}
      <div className="px-4 py-3 flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${match.winnerTeam === 1 ? 'text-zinc-100' : 'text-zinc-600'}`}>{team1}</p>
        </div>
        <div className="shrink-0 text-center px-2">
          <p className="font-mono text-sm font-bold text-zinc-300 tabular-nums tracking-wide">{scoreStr}</p>
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className={`text-sm font-semibold truncate ${match.winnerTeam === 2 ? 'text-zinc-100' : 'text-zinc-600'}`}>{team2}</p>
        </div>
      </div>

      {match.location && (
        <div className="px-4 pb-2.5">
          <p className="text-[11px] text-zinc-600">{match.location}</p>
        </div>
      )}
    </div>
  );
}
