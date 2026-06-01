import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, unauth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  if (!getUser(req)) return unauth();
  const sports = await prisma.sport.findMany({ orderBy: { name: 'asc' } });
  return NextResponse.json(sports);
}
