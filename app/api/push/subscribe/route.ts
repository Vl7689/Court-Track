import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getUser, unauth } from '@/lib/auth';

const schema = z.object({
  endpoint: z.string().url(),
  p256dh: z.string(),
  auth: z.string(),
});

export async function POST(req: NextRequest) {
  const user = getUser(req);
  if (!user) return unauth();

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });

  await prisma.pushSubscription.upsert({
    where: { endpoint: body.data.endpoint },
    create: { userId: user.userId, ...body.data },
    update: { userId: user.userId, p256dh: body.data.p256dh, auth: body.data.auth },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const user = getUser(req);
  if (!user) return unauth();

  const { endpoint } = await req.json();
  await prisma.pushSubscription.deleteMany({ where: { endpoint, userId: user.userId } });

  return NextResponse.json({ ok: true });
}
