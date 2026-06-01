import type { Match } from '@/types';

function formatScores(scores: { team1: number; team2: number }[]): string {
  return scores.map((s) => `${s.team1}–${s.team2}`).join(', ');
}

export default function MatchCard({ match, currentUserId }: { match: Match; currentUserId?: number }) {
  const onTeam1 = currentUserId != null && (match.t1p1.id === currentUserId || match.t1p2?.id === currentUserId);
  const onTeam2 = currentUserId != null && (match.t2p1.id === currentUserId || match.t2p2?.id === currentUserId);
  const participated = onTeam1 || onTeam2;
  const won = participated && ((onTeam1 && match.winnerTeam === 1) || (onTeam2 && match.winnerTeam === 2));
  const team1 = [match.t1p1.username, match.t1p2?.username].filter(Boolean).join(' & ');
  const team2 = [match.t2p1.username, match.t2p2?.username].filter(Boolean).join(' & ');

  return (
    <div className="bg-slate-800/50 border border-slate-700 hover:border-slate-600 rounded-xl p-4 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 bg-slate-700/60 px-2 py-0.5 rounded-full">{match.sport.name}</span>
          <span className="text-xs text-slate-500">{match.matchType}</span>
        </div>
        <div className="flex items-center gap-2">
          {participated && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${won ? 'bg-green-500/15 text-green-400 border-green-500/30' : 'bg-red-500/15 text-red-400 border-red-500/30'}`}>
              {won ? 'WIN' : 'LOSS'}
            </span>
          )}
          <span className="text-xs text-slate-500">
            {new Date(match.playedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-4">
        <div className={`flex-1 font-medium truncate ${match.winnerTeam === 1 ? 'text-white' : 'text-slate-400'}`}>
          {team1}{match.winnerTeam === 1 && <span className="ml-1.5 text-green-400 text-xs">W</span>}
        </div>
        <div className="text-sm text-slate-300 font-mono shrink-0">{formatScores(match.scores)}</div>
        <div className={`flex-1 font-medium truncate text-right ${match.winnerTeam === 2 ? 'text-white' : 'text-slate-400'}`}>
          {match.winnerTeam === 2 && <span className="mr-1.5 text-green-400 text-xs">W</span>}{team2}
        </div>
      </div>
      {match.location && <p className="text-xs text-slate-500 mt-2">📍 {match.location}</p>}
    </div>
  );
}
