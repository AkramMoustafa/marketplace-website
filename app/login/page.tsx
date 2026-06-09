'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { user, login, register } = useAuth();
  const router = useRouter();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) router.replace(user.role === 'admin' ? '/admin' : '/');
  }, [user, router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(name, email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">

      {/* Logo */}
      <Link href="/" className="flex items-baseline gap-2 mb-10">
        <span className="text-white font-black text-2xl tracking-[5px]">NOVA</span>
        <span className="text-[#B22222] text-[9px] font-black tracking-[6px] uppercase">MOTORS</span>
      </Link>

      <div className="w-full max-w-sm bg-slate-900 rounded-2xl border border-white/[0.06] p-8">

        {/* Mode tabs */}
        <div className="flex mb-7 bg-slate-800 rounded-xl p-1">
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }}
              className={`flex-1 py-2 text-xs font-black uppercase tracking-[1.5px] rounded-lg transition ${
                mode === m ? 'bg-[#B22222] text-black' : 'text-slate-400 hover:text-slate-200'
              }`}>
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">Full Name</label>
              <input value={name} onChange={e => setName(e.target.value)} required
                placeholder="John Smith"
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500
                  focus:outline-none focus:border-[#B22222] transition" />
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              placeholder="you@example.com"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500
                focus:outline-none focus:border-[#B22222] transition" />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                placeholder="Min. 8 characters"
                className="w-full px-4 py-3 pr-11 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500
                  focus:outline-none focus:border-[#B22222] transition" />
              <button type="button" onClick={() => setShowPw(s => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 bg-[#B22222] text-black font-black text-sm uppercase tracking-[1.5px] rounded-xl
              hover:bg-[#8B1A1A] disabled:opacity-60 transition mt-2">
            {loading ? (mode === 'login' ? 'Signing in…' : 'Creating account…') : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {mode === 'login' && (
          <p className="mt-5 text-center text-xs text-slate-500">
            Don&apos;t have an account?{' '}
            <button onClick={() => setMode('register')} className="text-[#B22222] hover:underline font-bold">
              Register
            </button>
          </p>
        )}
      </div>

      <Link href="/" className="mt-8 text-xs text-slate-600 hover:text-slate-400 transition">
        ← Back to site
      </Link>
    </div>
  );
}
