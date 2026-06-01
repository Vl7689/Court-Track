import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUser, unauth } from '@/lib/auth';

const groupInclude = {
  createdBy: { select: { id: true, username: true } },
  _count: { select: { members: true } },
};

export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return unauth();
  const groups = await prisma.group.findMany({
    where: { members: { some: { userId: user.userId } } },
    include: groupInclude,
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json(groups);
}

export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return unauth();
  const body = z.object({ name: z.string().min(1).max(50) }).safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: 'Group name required (max 50 chars)' }, { status: 400 });

  const group = await prisma.group.create({
    data: { name: body.data.name.trim(), createdById: user.userId, members: { create: { userId: user.userId } } },
    include: groupInclude,
  });
  return NextResponse.json(group, { status: 201 });
}
