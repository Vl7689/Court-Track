import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, type JwtPayload } from './jwt';

export function getUser(req: NextRequest): JwtPayload | null {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  try {
    return verifyToken(auth.slice(7));
  } catch {
    return null;
  }
}

export const unauth = () =>
  NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
