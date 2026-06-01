import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, unauth } from '@/lib/auth';

const matchInclude = {
  sport: true,
  t1p1: { select: { id: true, username: true } },
  t1p2: { select: { id: true, username: true } },
  t2p1: { select: { id: true, username: true } },
  t2p2: { select: { id: true, username: true } },
};

export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return unauth();

  const matches = await prisma.match.findMany({
    where: {
      status: 'pending',
      loggedById: { not: user.userId },
      OR: [
        { t1p1Id: user.userId }, { t1p2Id: user.userId },
        { t2p1Id: user.userId }, { t2p2Id: user.userId },
      ],
    },
    include: matchInclude,
    orderBy: { playedAt: 'desc' },
  });

  return NextResponse.json(matches.map(m => ({ ...m, scores: JSON.parse(m.scores) })));
}
