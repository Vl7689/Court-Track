import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUser, unauth } from '@/lib/auth';

const matchInclude = {
  sport: true,
  t1p1: { select: { id: true, username: true } },
  t1p2: { select: { id: true, username: true } },
  t2p1: { select: { id: true, username: true } },
  t2p2: { select: { id: true, username: true } },
};

const schema = z.object({
  sportId: z.number().int().positive(),
  matchType: z.enum(['singles', 'doubles']),
  location: z.string().max(100).optional(),
  t1p1Id: z.number().int().positive(),
  t1p2Id: z.number().int().positive().optional(),
  t2p1Id: z.number().int().positive(),
  t2p2Id: z.number().int().positive().optional(),
  scores: z.array(z.object({ team1: z.number().int().min(0), team2: z.number().int().min(0) })).min(1),
  winnerTeam: z.literal(1).or(z.literal(2)),
});

export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return unauth();

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.errors[0].message }, { status: 400 });
  }

  const { scores, ...rest } = body.data;
  const match = await prisma.match.create({
    data: { ...rest, scores: JSON.stringify(scores) },
    include: matchInclude,
  });

  return NextResponse.json({ ...match, scores: JSON.parse(match.scores) }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const user = getUser(req);
  if (!user) return unauth();

  const { searchParams } = new URL(req.url);
  const sportSlug = searchParams.get('sport');
  const limit = Math.min(Number(searchParams.get('limit') ?? 50), 50);

  const sport = sportSlug
    ? await prisma.sport.findUnique({ where: { slug: sportSlug } })
    : null;

  const matches = await prisma.match.findMany({
    where: {
      ...(sport ? { sportId: sport.id } : {}),
      OR: [
        { t1p1Id: user.userId }, { t1p2Id: user.userId },
        { t2p1Id: user.userId }, { t2p2Id: user.userId },
      ],
    },
    include: matchInclude,
    orderBy: { playedAt: 'desc' },
    take: limit,
  });

  return NextResponse.json(matches.map((m) => ({ ...m, scores: JSON.parse(m.scores) })));
}
