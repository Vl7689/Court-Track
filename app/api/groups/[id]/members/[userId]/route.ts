import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getUser, unauth } from '@/lib/auth';

export async function DELETE(req: NextRequest, { params }: { params: { id: string; userId: string } }) {
  const user = getUser(req);
  if (!user) return unauth();

  const groupId = Number(params.id);
  const targetUserId = Number(params.userId);

  const group = await prisma.group.findFirst({
    where: { id: groupId, members: { some: { userId: user.userId } } },
  });
  if (!group) return NextResponse.json({ error: 'You are not in this group' }, { status: 403 });
  if (group.createdById !== user.userId && targetUserId !== user.userId) {
    return NextResponse.json({ error: 'Only the group creator can remove other members' }, { status: 403 });
  }

  await prisma.groupMember.delete({ where: { groupId_userId: { groupId, userId: targetUserId } } });
  return NextResponse.json({ message: 'Member removed' });
}
