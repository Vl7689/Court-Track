import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUser, unauth } from '@/lib/auth';
import { createNotification } from '@/lib/push';

const schema = z.object({ action: z.enum(['confirmed', 'disputed']) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getUser(req);
  if (!user) return unauth();

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  const matchId = parseInt(params.id, 10);
  const match = await prisma.match.findUnique({ where: { id: matchId } });

  if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });

  const isParticipant = [match.t1p1Id, match.t1p2Id, match.t2p1Id, match.t2p2Id].includes(user.userId);
  if (!isParticipant) return NextResponse.json({ error: 'Not a participant' }, { status: 403 });

  if (match.loggedById === user.userId) {
    return NextResponse.json({ error: 'Cannot confirm your own match' }, { status: 403 });
  }

  const confirmerName = await prisma.user.findUnique({ where: { id: user.userId }, select: { username: true } });
  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { status: body.data.action },
  });

  if (match.loggedById) {
    const isConfirmed = body.data.action === 'confirmed';
    createNotification(
      match.loggedById,
      isConfirmed ? 'match_confirmed' : 'match_disputed',
      isConfirmed ? 'Match confirmed ✅' : 'Match disputed ⚠️',
      `${confirmerName?.username ?? 'Someone'} ${isConfirmed ? 'confirmed' : 'disputed'} your match result`,
      matchId,
    ).catch(() => {});
  }

  return NextResponse.json(updated);
}
