'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthContext } from '@/app/providers';

export default function LoginPage() {
  const { login } = useAuthContext();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      login(data.token, data.user);
      router.push('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(typeof msg === 'string' ? msg : 'Login failed');
    } finally { setLoading(false); }
  };

  const inp = 'w-full bg-transparent border-b border-zinc-700 focus:border-green-500 px-0 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors text-base';

  return (
    <div className="min-h-screen flex flex-col px-6" style={{ paddingTop: 'max(env(safe-area-inset-top), 60px)' }}>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="mb-12">
          <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">CourtTrack</p>
          <h1 className="text-4xl font-black text-white leading-tight">
            Welcome<br />back.
          </h1>
          <p className="text-zinc-500 mt-3 text-sm">Track your game. Own your stats.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest block mb-1">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)} className={inp} placeholder="your username" required autoFocus />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest block mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className={inp} placeholder="••••••" required />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button type="submit" disabled={loading}
            className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black font-bold py-4 rounded-2xl transition-colors mt-4 text-base tracking-wide glow-green">
            {loading ? 'Signing in...' : 'Sign in →'}
          </button>
        </form>

        <p className="text-zinc-600 text-sm mt-8 text-center">
          New here?{' '}
          <Link href="/register" className="text-zinc-300 hover:text-white font-medium transition-colors">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
