import jwt from 'jsonwebtoken';

export interface JwtPayload {
  userId: number;
  username: string;
}

const secret = () => {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET not set');
  return s;
};

export const signToken = (payload: JwtPayload) =>
  jwt.sign(payload, secret(), { expiresIn: '7d' });

export const verifyToken = (token: string): JwtPayload =>
  jwt.verify(token, secret()) as JwtPayload;
