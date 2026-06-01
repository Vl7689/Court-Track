export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Sport {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  pointSystem: string;
}

export interface ScoreSet { team1: number; team2: number }
export interface MatchPlayer { id: number; username: string }

export interface Match {
  id: number;
  sport: Sport;
  matchType: 'singles' | 'doubles';
  location: string | null;
  scores: ScoreSet[];
  winnerTeam: 1 | 2;
  status: 'pending' | 'confirmed' | 'disputed';
  loggedById: number | null;
  t1p1: MatchPlayer;
  t1p2: MatchPlayer | null;
  t2p1: MatchPlayer;
  t2p2: MatchPlayer | null;
  playedAt: string;
}

export interface H2HRecord {
  opponent: MatchPlayer;
  wins: number; losses: number; total: number; winRate: number;
}

export interface FormatSplit {
  wins: number; losses: number; total: number; winRate: number;
}

export interface FormWindow {
  matches: number; wins: number; winRate: number;
}

export interface MomentumWindow {
  wins: number; losses: number; total: number; winRate: number;
}

export interface MatchHighlight {
  id: number; opponent: string; scoreStr: string; margin: number; sport: string;
}

export interface PlayerStats {
  user: { id: number; username: string; createdAt: string };
  stats: {
    wins: number; losses: number; total: number; winRate: number;
    currentStreak: number; streakType: 'W' | 'L' | null; maxStreak: number;
  };
  headToHead: H2HRecord[];
  nemesis: H2HRecord | null;
  bestVictim: H2HRecord | null;
  locationStats: Array<{ location: string; wins: number; losses: number; total: number; winRate: number }>;
  partnerStats: Array<{ partner: MatchPlayer; wins: number; losses: number; total: number; winRate: number }>;
  sportBreakdown: Array<{ sport: { id: number; name: string; slug: string }; wins: number; losses: number; total: number; winRate: number }>;
  formatBreakdown: { singles: FormatSplit; doubles: FormatSplit };
  dayOfWeek: Array<{ day: string; dayIdx: number; wins: number; losses: number; total: number; winRate: number }>;
  setStats: {
    totalSets: number; setsWon: number; setsLost: number; setWinRate: number;
    avgScoreFor: number; avgScoreAgainst: number;
    closeSetWins: number; closeSetLosses: number;
    comebackWins: number; comebackLosses: number;
    firstSetWinRate: number; clutchRate: number; clutchGames: number;
  };
  momentum: { afterWin: MomentumWindow; afterLoss: MomentumWindow };
  highlights: { biggestWin: MatchHighlight | null; closestWin: MatchHighlight | null };
  formTrend: { last5: FormWindow; last10: FormWindow; overall: FormWindow };
  recentMatches: Match[];
}

export interface LeaderboardEntry {
  id: number; username: string; wins: number; losses: number; total: number; winRate: number; rank: number;
}

export interface Group {
  id: number; name: string;
  createdBy: { id: number; username: string };
  createdAt: string;
  _count: { members: number };
}

export interface GroupDetail extends Omit<Group, '_count'> {
  members: Array<{ userId: number; joinedAt: string; user: { id: number; username: string } }>;
}
