import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, unauth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!getUser(req)) return unauth();
  const users = await prisma.user.findMany({
    select: { id: true, username: true },
    orderBy: { username: 'asc' },
  });
  return NextResponse.json(users);
}
