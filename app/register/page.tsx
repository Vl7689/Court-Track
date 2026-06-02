'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthContext } from '@/app/providers';

export default function RegisterPage() {
  const { login } = useAuthContext();
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      login(data.token, data.user);
      router.push('/');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error;
      setError(typeof msg === 'string' ? msg : 'Registration failed');
    } finally { setLoading(false); }
  };

  const inp = 'w-full bg-transparent border-b border-zinc-700 focus:border-green-500 px-0 py-3 text-zinc-100 placeholder-zinc-600 focus:outline-none transition-colors text-base';

  return (
    <div className="min-h-screen flex flex-col px-6" style={{ paddingTop: 'max(env(safe-area-inset-top), 60px)' }}>
      <div className="flex-1 flex flex-col justify-center max-w-sm mx-auto w-full">
        <div className="mb-10">
          <p className="text-green-400 text-xs font-bold tracking-[0.2em] uppercase mb-3">CourtTrack</p>
          <h1 className="text-4xl font-black text-white leading-tight">
            Create your<br />account.
          </h1>
          <p className="text-zinc-500 mt-3 text-sm">Start tracking your wins and stats.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {[
            { k: 'username', label: 'Username', type: 'text', placeholder: 'your handle' },
            { k: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
            { k: 'password', label: 'Password', type: 'password', placeholder: '6+ characters' },
          ].map(({ k, label, type, placeholder }) => (
            <div key={k}>
              <label className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest block mb-1">{label}</label>
              <input type={type} value={form[k as keyof typeof form]} onChange={set(k as keyof typeof form)}
                className={inp} placeholder={placeholder} required />
            </div>
          ))}

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-40 text-black font-bold py-4 rounded-2xl transition-colors text-base tracking-wide glow-green">
            {loading ? 'Creating...' : 'Create account →'}
          </button>
        </form>

        <p className="text-zinc-600 text-sm mt-8 text-center">
          Already have an account?{' '}
          <Link href="/login" className="text-zinc-300 hover:text-white font-medium transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
