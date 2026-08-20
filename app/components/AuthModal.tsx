'use client';

import React, { useState } from 'react';
import { X, LogIn, UserPlus, Mail, Lock, User } from 'lucide-react';
import { API_BASE, User as UserType } from '../lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (token: string, user: UserType) => void;
  defaultMode?: 'login' | 'register';
}

export default function AuthModal({
  isOpen,
  onClose,
  onAuthSuccess,
  defaultMode = 'login',
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const body =
        mode === 'login'
          ? { email, password }
          : { name, email, password, role: 'user' };

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || 'Authentication failed');
      }

      const data = await res.json();
      onAuthSuccess(data.token, data.user);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md animate-rise-in rounded-3xl border border-white/[0.08] bg-ink-900/95 p-6 shadow-panel backdrop-blur-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-ink-400 transition hover:bg-white/10 hover:text-mist"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <p className="font-display text-sm font-bold text-signal">riwu-music</p>
          <h2 className="mt-2 font-display text-2xl font-bold text-mist">
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p className="mt-1 text-sm text-ink-400">
            {mode === 'login'
              ? 'Sign in to stream, download, and sync your library'
              : 'Save playlists, history, and offline tracks'}
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-ember/30 bg-ember/10 p-3 text-sm text-ember">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                type="text"
                placeholder="Display name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="field w-full rounded-xl py-3 pl-10 pr-4 text-sm"
              />
            </div>
          )}

          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="field w-full rounded-xl py-3 pl-10 pr-4 text-sm"
            />
          </div>

          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="field w-full rounded-xl py-3 pl-10 pr-4 text-sm"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-signal flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm">
            {mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {loading ? 'Please wait…' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-ink-400">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login');
              setError(null);
            }}
            className="font-semibold text-signal hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
