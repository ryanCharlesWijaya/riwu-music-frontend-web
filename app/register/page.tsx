'use client';

import React, { useState } from 'react';
import { Shield, UserPlus, Mail, Lock, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE } from '../lib/api';

/**
 * Hidden registration route for admin account creation.
 * Not linked in the main navigation — access via /register directly.
 */
export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Registration failed');
      }

      setSuccess(true);
      setTimeout(() => router.push('/'), 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090b10] flex items-center justify-center p-4">
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-amber-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative w-full max-w-md glass-panel rounded-3xl p-8 border border-white/10 shadow-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-6 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to player
        </Link>

        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Account Registration</h1>
          <p className="text-sm text-slate-400">
            Hidden route for user and administrator account creation
          </p>
        </div>

        {success ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-center">
            Account created! Redirecting to player...
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Display name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  placeholder="Password (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500/50"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-2 block">
                  Role (RBAC)
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
                  className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 text-white focus:outline-none focus:border-amber-500/50"
                >
                  <option value="user">Standard User</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white font-semibold shadow-lg shadow-amber-600/30 hover:opacity-90 transition disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
