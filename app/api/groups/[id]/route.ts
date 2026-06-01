import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, unauth } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getUser(req);
  if (!user) return unauth();

  const group = await prisma.group.findFirst({
    where: { id: Number(params.id), members: { some: { userId: user.userId } } },
    include: {
      createdBy: { select: { id: true, username: true } },
      members: {
        include: { user: { select: { id: true, username: true } } },
        orderBy: { joinedAt: 'asc' },
      },
    },
  });

  if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  return NextResponse.json(group);
}
