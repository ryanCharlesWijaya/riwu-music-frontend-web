'use client';

import React, { useEffect, useState } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import { fetchWithAuth } from '../lib/api';

interface PasswordModalProps {
  isOpen: boolean;
  token: string;
  onClose: () => void;
}

export default function PasswordModal({ isOpen, token, onClose }: PasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setSuccess(false);
    setShow(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await fetchWithAuth('/auth/password', token, {
        method: 'POST',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setSuccess(true);
      setTimeout(onClose, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update password');
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

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-signal">Security</p>
          <h2 className="mt-1 font-sans text-2xl font-bold text-mist">Update password</h2>
          <p className="mt-1 text-sm text-ink-400">Choose a new password for your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-400">
            Current password
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                type={show ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="field w-full rounded-xl py-3 pl-10 pr-10 text-sm"
              />
            </div>
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-400">
            New password
            <div className="relative mt-1.5">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
              <input
                type={show ? 'text' : 'password'}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="field w-full rounded-xl py-3 pl-10 pr-10 text-sm"
              />
              <button
                type="button"
                onClick={() => setShow((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-500 hover:text-mist"
              >
                {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          <label className="block text-xs font-semibold uppercase tracking-wide text-ink-400">
            Confirm new password
            <input
              type={show ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="field mt-1.5 w-full rounded-xl px-4 py-3 text-sm"
            />
          </label>

          {error && <p className="text-sm text-ember">{error}</p>}
          {success && <p className="text-sm text-signal">Password updated.</p>}

          <button type="submit" disabled={loading} className="btn-signal mt-2 w-full rounded-xl py-3 text-sm">
            {loading ? 'Saving…' : 'Save password'}
          </button>
        </form>
      </div>
    </div>
  );
}
