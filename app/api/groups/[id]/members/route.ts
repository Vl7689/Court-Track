import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUser, unauth } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const user = getUser(req);
  if (!user) return unauth();

  const groupId = Number(params.id);
  const body = z.object({ username: z.string().min(1) }).safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: 'Username required' }, { status: 400 });

  const member = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: user.userId } },
  });
  if (!member) return NextResponse.json({ error: 'You are not in this group' }, { status: 403 });

  const target = await prisma.user.findUnique({
    where: { username: body.data.username.trim() },
    select: { id: true, username: true },
  });
  if (!target) return NextResponse.json({ error: `User "${body.data.username}" not found` }, { status: 404 });

  const existing = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: target.id } },
  });
  if (existing) return NextResponse.json({ error: `${target.username} is already in this group` }, { status: 409 });

  await prisma.groupMember.create({ data: { groupId, userId: target.id } });
  return NextResponse.json(target);
}
