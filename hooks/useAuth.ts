'use client';
import { useState } from 'react';
import type { User } from '@/types';

const stored = (key: string) => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const s = stored('user');
    return s ? (JSON.parse(s) as User) : null;
  });

  const login = (token: string, u: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return { user, login, logout };
}
