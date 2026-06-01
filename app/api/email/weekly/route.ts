import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWeeklyReport } from '@/lib/email';

export async function GET(req: NextRequest) {
  // Verify this is called from Vercel cron or an admin
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const users = await prisma.user.findMany({ select: { id: true, username: true, email: true } });

  const results = await Promise.allSettled(
    users.map(async (u) => {
      const matches = await prisma.match.findMany({
        where: {
          OR: [{ t1p1Id: u.id }, { t1p2Id: u.id }, { t2p1Id: u.id }, { t2p2Id: u.id }],
        },
        orderBy: { playedAt: 'desc' },
      });

      const wins = matches.filter(m => {
        const onTeam1 = m.t1p1Id === u.id || m.t1p2Id === u.id;
        return (onTeam1 && m.winnerTeam === 1) || (!onTeam1 && m.winnerTeam === 2);
      }).length;
      const losses = matches.length - wins;

      let streak = 0;
      let streakType: 'W' | 'L' | null = null;
      for (const m of matches) {
        const onTeam1 = m.t1p1Id === u.id || m.t1p2Id === u.id;
        const won = (onTeam1 && m.winnerTeam === 1) || (!onTeam1 && m.winnerTeam === 2);
        const type = won ? 'W' : 'L';
        if (streak === 0) { streak = 1; streakType = type; }
        else if (type === streakType) streak++;
        else break;
      }

      // Rough rank: count users with more wins
      const rank = (await prisma.user.count()) - wins + 1;

      await sendWeeklyReport({ to: u.email, username: u.username, wins, losses, streak, streakType, rank });
    }),
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  return NextResponse.json({ sent });
}
