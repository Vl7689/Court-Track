import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, unauth } from '@/lib/auth';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const toRate = (w: number, t: number) => (t > 0 ? Math.round((w / t) * 100) : 0);

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  if (!getUser(req)) return unauth();

  const userId = Number(params.userId);
  if (isNaN(userId)) return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, createdAt: true },
  });
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

  const sportSlug = new URL(req.url).searchParams.get('sport');
  const sport = sportSlug ? await prisma.sport.findUnique({ where: { slug: sportSlug } }) : null;

  const matches = await prisma.match.findMany({
    where: {
      ...(sport ? { sportId: sport.id } : {}),
      OR: [{ t1p1Id: userId }, { t1p2Id: userId }, { t2p1Id: userId }, { t2p2Id: userId }],
    },
    include: {
      sport: true,
      t1p1: { select: { id: true, username: true } },
      t1p2: { select: { id: true, username: true } },
      t2p1: { select: { id: true, username: true } },
      t2p2: { select: { id: true, username: true } },
    },
    orderBy: { playedAt: 'desc' },
  });

  let wins = 0, losses = 0, currentStreak = 0, maxStreak = 0;
  let streakType: 'W' | 'L' | null = null;
  const h2hMap: Record<number, { username: string; wins: number; losses: number }> = {};
  const locationMap: Record<string, { wins: number; losses: number }> = {};
  const partnerMap: Record<number, { username: string; wins: number; losses: number }> = {};
  const sportMap: Record<number, { name: string; slug: string; wins: number; losses: number }> = {};
  const dayMap: Record<number, { wins: number; losses: number }> = {};
  const fmt = { singles: { wins: 0, losses: 0 }, doubles: { wins: 0, losses: 0 } };
  let totalSets = 0, setsWon = 0, totalFor = 0, totalAgainst = 0;
  let closeW = 0, closeL = 0, comebackW = 0, comebackL = 0, firstSetW = 0;
  let clutchW = 0, clutchTotal = 0;
  const results: boolean[] = [];
  let biggestWin: { idx: number; margin: number } | null = null;
  let closestWin: { idx: number; margin: number } | null = null;

  for (let idx = 0; idx < matches.length; idx++) {
    const m = matches[idx];
    const onTeam1 = m.t1p1Id === userId || m.t1p2Id === userId;
    const won = (onTeam1 && m.winnerTeam === 1) || (!onTeam1 && m.winnerTeam === 2);
    results.push(won);

    if (won) wins++; else losses++;
    if (!streakType) { streakType = won ? 'W' : 'L'; currentStreak = 1; }
    else if ((won && streakType === 'W') || (!won && streakType === 'L')) currentStreak++;
    else { streakType = won ? 'W' : 'L'; currentStreak = 1; }
    if (currentStreak > maxStreak) maxStreak = currentStreak;

    const opps = (onTeam1 ? [m.t2p1, m.t2p2] : [m.t1p1, m.t1p2])
      .filter((p): p is { id: number; username: string } => p !== null);
    for (const o of opps) {
      if (!h2hMap[o.id]) h2hMap[o.id] = { username: o.username, wins: 0, losses: 0 };
      if (won) h2hMap[o.id].wins++; else h2hMap[o.id].losses++;
    }

    if (m.matchType === 'doubles') {
      const partner = onTeam1
        ? (m.t1p1Id === userId ? m.t1p2 : m.t1p1)
        : (m.t2p1Id === userId ? m.t2p2 : m.t2p1);
      if (partner) {
        if (!partnerMap[partner.id]) partnerMap[partner.id] = { username: partner.username, wins: 0, losses: 0 };
        if (won) partnerMap[partner.id].wins++; else partnerMap[partner.id].losses++;
      }
    }

    if (m.location) {
      if (!locationMap[m.location]) locationMap[m.location] = { wins: 0, losses: 0 };
      if (won) locationMap[m.location].wins++; else locationMap[m.location].losses++;
    }

    if (!sportMap[m.sportId]) sportMap[m.sportId] = { name: m.sport.name, slug: m.sport.slug, wins: 0, losses: 0 };
    if (won) sportMap[m.sportId].wins++; else sportMap[m.sportId].losses++;

    const f = m.matchType === 'doubles' ? 'doubles' : 'singles';
    if (won) fmt[f].wins++; else fmt[f].losses++;

    const di = new Date(m.playedAt).getDay();
    if (!dayMap[di]) dayMap[di] = { wins: 0, losses: 0 };
    if (won) dayMap[di].wins++; else dayMap[di].losses++;

    const sc: Array<{ team1: number; team2: number }> = JSON.parse(m.scores);
    let matchMargin = 0;
    for (let i = 0; i < sc.length; i++) {
      const my = onTeam1 ? sc[i].team1 : sc[i].team2;
      const their = onTeam1 ? sc[i].team2 : sc[i].team1;
      const wonSet = my > their;
      totalSets++; if (wonSet) setsWon++;
      totalFor += my; totalAgainst += their;
      matchMargin += my - their;
      const mg = Math.abs(my - their);
      if (mg <= 2) { if (wonSet) closeW++; else closeL++; }
      if (i === 0 && wonSet) firstSetW++;
    }
    if (sc.length > 1) {
      const wonFirst = onTeam1 ? sc[0].team1 > sc[0].team2 : sc[0].team2 > sc[0].team1;
      if (!wonFirst && won) comebackW++;
      if (wonFirst && !won) comebackL++;
    }
    if (sc.length >= 3) {
      const last = sc[sc.length - 1];
      if (onTeam1 ? last.team1 > last.team2 : last.team2 > last.team1) clutchW++;
      clutchTotal++;
    }
    if (won) {
      if (!biggestWin || matchMargin > biggestWin.margin) biggestWin = { idx, margin: matchMargin };
      if (!closestWin || matchMargin < closestWin.margin) closestWin = { idx, margin: matchMargin };
    }
  }

  const total = wins + losses;
  const momentum = { afterWin: { wins: 0, losses: 0 }, afterLoss: { wins: 0, losses: 0 } };
  for (let i = 0; i < results.length - 1; i++) {
    const prev = results[i + 1], next = results[i];
    if (prev) { if (next) momentum.afterWin.wins++; else momentum.afterWin.losses++; }
    else { if (next) momentum.afterLoss.wins++; else momentum.afterLoss.losses++; }
  }

  const h2h = Object.entries(h2hMap)
    .map(([id, d]) => ({ opponent: { id: Number(id), username: d.username }, wins: d.wins, losses: d.losses, total: d.wins + d.losses, winRate: toRate(d.wins, d.wins + d.losses) }))
    .sort((a, b) => b.total - a.total);

  const nemesis = [...h2h].filter(h => h.total >= 2 && h.losses > h.wins).sort((a, b) => a.winRate - b.winRate || b.total - a.total)[0] ?? null;
  const bestVictim = [...h2h].filter(h => h.total >= 2 && h.wins > h.losses).sort((a, b) => b.winRate - a.winRate || b.total - a.total)[0] ?? null;

  const mkSplit = (d: { wins: number; losses: number }) => ({ ...d, total: d.wins + d.losses, winRate: toRate(d.wins, d.wins + d.losses) });
  const mkMomentum = (d: { wins: number; losses: number }) => ({ ...d, total: d.wins + d.losses, winRate: toRate(d.wins, d.wins + d.losses) });

  const buildHighlight = (e: { idx: number; margin: number } | null) => {
    if (!e) return null;
    const m = matches[e.idx];
    const onT1 = m.t1p1Id === userId || m.t1p2Id === userId;
    const opp = (onT1 ? [m.t2p1, m.t2p2] : [m.t1p1, m.t1p2]).filter(Boolean).map(p => p!.username).join(' & ');
    const sc: Array<{ team1: number; team2: number }> = JSON.parse(m.scores);
    const scoreStr = sc.map(s => `${onT1 ? s.team1 : s.team2}–${onT1 ? s.team2 : s.team1}`).join(', ');
    return { id: m.id, opponent: opp, scoreStr, margin: e.margin, sport: m.sport.name };
  };

  const calcForm = (ms: typeof matches) => {
    if (!ms.length) return { matches: 0, wins: 0, winRate: 0 };
    const w = ms.filter(m => { const t = m.t1p1Id === userId || m.t1p2Id === userId; return (t && m.winnerTeam === 1) || (!t && m.winnerTeam === 2); }).length;
    return { matches: ms.length, wins: w, winRate: toRate(w, ms.length) };
  };

  return NextResponse.json({
    user,
    stats: { wins, losses, total, winRate: toRate(wins, total), currentStreak, streakType, maxStreak },
    headToHead: h2h,
    nemesis, bestVictim,
    locationStats: Object.entries(locationMap).map(([location, d]) => ({ location, wins: d.wins, losses: d.losses, total: d.wins + d.losses, winRate: toRate(d.wins, d.wins + d.losses) })).sort((a, b) => b.total - a.total),
    partnerStats: Object.entries(partnerMap).map(([id, d]) => ({ partner: { id: Number(id), username: d.username }, wins: d.wins, losses: d.losses, total: d.wins + d.losses, winRate: toRate(d.wins, d.wins + d.losses) })).sort((a, b) => b.total - a.total),
    sportBreakdown: Object.entries(sportMap).map(([id, d]) => ({ sport: { id: Number(id), name: d.name, slug: d.slug }, wins: d.wins, losses: d.losses, total: d.wins + d.losses, winRate: toRate(d.wins, d.wins + d.losses) })).sort((a, b) => b.total - a.total),
    formatBreakdown: { singles: mkSplit(fmt.singles), doubles: mkSplit(fmt.doubles) },
    dayOfWeek: Object.entries(dayMap).map(([i, d]) => ({ day: DAYS[Number(i)], dayIdx: Number(i), wins: d.wins, losses: d.losses, total: d.wins + d.losses, winRate: toRate(d.wins, d.wins + d.losses) })).sort((a, b) => b.winRate - a.winRate || b.total - a.total),
    setStats: { totalSets, setsWon, setsLost: totalSets - setsWon, setWinRate: toRate(setsWon, totalSets), avgScoreFor: totalSets > 0 ? Math.round((totalFor / totalSets) * 10) / 10 : 0, avgScoreAgainst: totalSets > 0 ? Math.round((totalAgainst / totalSets) * 10) / 10 : 0, closeSetWins: closeW, closeSetLosses: closeL, comebackWins: comebackW, comebackLosses: comebackL, firstSetWinRate: toRate(firstSetW, total), clutchRate: toRate(clutchW, clutchTotal), clutchGames: clutchTotal },
    momentum: { afterWin: mkMomentum(momentum.afterWin), afterLoss: mkMomentum(momentum.afterLoss) },
    highlights: { biggestWin: buildHighlight(biggestWin), closestWin: buildHighlight(closestWin?.idx !== biggestWin?.idx ? closestWin : null) },
    formTrend: { last5: calcForm(matches.slice(0, 5)), last10: calcForm(matches.slice(0, 10)), overall: { matches: total, wins, winRate: toRate(wins, total) } },
    recentMatches: matches.slice(0, 10).map(m => ({ ...m, scores: JSON.parse(m.scores) })),
  });
}
