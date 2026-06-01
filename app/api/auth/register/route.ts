import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';

const schema = z.object({
  username: z.string().min(3).max(30).regex(/^\w+$/, 'Letters, numbers, underscores only'),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(req: NextRequest) {
  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: body.error.errors[0].message }, { status: 400 });
  }

  const { username, email, password } = body.data;

  const existing = await prisma.user.findFirst({
    where: { OR: [{ username }, { email }] },
  });
  if (existing) {
    const field = existing.username === username ? 'Username' : 'Email';
    return NextResponse.json({ error: `${field} already taken` }, { status: 409 });
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { username, email, password: hashed },
    select: { id: true, username: true, email: true },
  });

  const token = signToken({ userId: user.id, username: user.username });
  return NextResponse.json({ token, user }, { status: 201 });
}
