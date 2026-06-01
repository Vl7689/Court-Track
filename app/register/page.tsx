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

  const inp = 'w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-green-500 transition-colors';

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-3xl font-bold text-green-400 text-center mb-1">CourtTrack</h1>
        <p className="text-slate-400 text-center text-sm mb-8">Create your account</p>
        <form onSubmit={handleSubmit} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 space-y-4">
          {[
            { k: 'username', label: 'Username', type: 'text', placeholder: 'pickleball_king' },
            { k: 'email', label: 'Email', type: 'email', placeholder: 'you@example.com' },
            { k: 'password', label: 'Password', type: 'password', placeholder: '6+ characters' },
          ].map(({ k, label, type, placeholder }) => (
            <div key={k}>
              <label className="text-xs text-slate-400 uppercase tracking-wide block mb-1.5">{label}</label>
              <input type={type} value={form[k as keyof typeof form]} onChange={set(k as keyof typeof form)} className={inp} placeholder={placeholder} required />
            </div>
          ))}
          {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black font-semibold py-2.5 rounded-lg transition-colors">
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <p className="text-center text-slate-500 text-sm mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-green-400 hover:text-green-300">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
