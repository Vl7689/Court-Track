import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, unauth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!getUser(req)) return unauth();

  const { searchParams } = new URL(req.url);
  const sportSlug = searchParams.get('sport');
  const groupId = searchParams.get('group') ? Number(searchParams.get('group')) : undefined;

  const sport = sportSlug
    ? await prisma.sport.findUnique({ where: { slug: sportSlug } })
    : null;

  let allowedUserIds: number[] | undefined;
  if (groupId) {
    const members = await prisma.groupMember.findMany({
      where: { groupId },
      select: { userId: true },
    });
    allowedUserIds = members.map((m) => m.userId);
    if (allowedUserIds.length === 0) return NextResponse.json([]);
  }

  const matches = await prisma.match.findMany({
    where: {
      ...(sport ? { sportId: sport.id } : {}),
      ...(allowedUserIds ? {
        OR: [
          { t1p1Id: { in: allowedUserIds } }, { t1p2Id: { in: allowedUserIds } },
          { t2p1Id: { in: allowedUserIds } }, { t2p2Id: { in: allowedUserIds } },
        ],
      } : {}),
    },
    select: { t1p1Id: true, t1p2Id: true, t2p1Id: true, t2p2Id: true, winnerTeam: true },
  });

  const stats: Record<number, { wins: number; losses: number }> = {};
  const record = (id: number | null, won: boolean) => {
    if (!id) return;
    if (!stats[id]) stats[id] = { wins: 0, losses: 0 };
    if (won) stats[id].wins++; else stats[id].losses++;
  };

  for (const m of matches) {
    const t1Won = m.winnerTeam === 1;
    record(m.t1p1Id, t1Won); record(m.t1p2Id ?? null, t1Won);
    record(m.t2p1Id, !t1Won); record(m.t2p2Id ?? null, !t1Won);
  }

  let userIds = Object.keys(stats).map(Number);
  if (allowedUserIds) userIds = userIds.filter((id) => allowedUserIds!.includes(id));
  if (userIds.length === 0) return NextResponse.json([]);

  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, username: true },
  });

  const board = users
    .map((u) => {
      const s = stats[u.id];
      const total = s.wins + s.losses;
      return { id: u.id, username: u.username, wins: s.wins, losses: s.losses, total, winRate: total > 0 ? Math.round((s.wins / total) * 100) : 0 };
    })
    .sort((a, b) => b.wins - a.wins || b.winRate - a.winRate)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return NextResponse.json(board);
}
