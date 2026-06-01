import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/jwt';

const schema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username: body.data.username } });
  if (!user || !(await bcrypt.compare(body.data.password, user.password))) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  const token = signToken({ userId: user.id, username: user.username });
  return NextResponse.json({ token, user: { id: user.id, username: user.username, email: user.email } });
}
