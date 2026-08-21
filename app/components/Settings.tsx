'use client';

import React, { useEffect, useState } from 'react';
import {
  Download,
  Lock,
  LogOut,
  Moon,
  Sun,
  User,
  Mail,
  Settings as SettingsIcon,
} from 'lucide-react';
import { User as UserType, fetchWithAuth } from '../lib/api';

export type ThemeMode = 'dark' | 'light';

interface SettingsProps {
  user: UserType | null;
  token: string | null;
  theme: ThemeMode;
  autoLocalPlaylist: boolean;
  onThemeChange: (theme: ThemeMode) => void;
  onAutoLocalPlaylistChange: (enabled: boolean) => void;
  onUserUpdated: (user: UserType) => void;
  onOpenPasswordModal: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export default function Settings({
  user,
  token,
  theme,
  autoLocalPlaylist,
  onThemeChange,
  onAutoLocalPlaylistChange,
  onUserUpdated,
  onOpenPasswordModal,
  onOpenAuth,
  onLogout,
}: SettingsProps) {
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);

  useEffect(() => {
    setName(user?.name || '');
    setEmail(user?.email || '');
  }, [user?.id, user?.name, user?.email]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) {
      onOpenAuth();
      return;
    }
    setSavingProfile(true);
    setProfileMsg(null);
    setProfileError(null);
    try {
      const updated = await fetchWithAuth('/auth/profile', token, {
        method: 'POST',
        body: JSON.stringify({ name: name.trim(), email: email.trim() }),
      });
      onUserUpdated(updated as UserType);
      setProfileMsg('Profile saved.');
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="animate-rise-in mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <SettingsIcon className="h-7 w-7 text-signal" />
        <div>
          <h1 className="font-sans text-2xl font-bold text-mist sm:text-3xl">Settings</h1>
          <p className="mt-1 text-sm text-ink-400">Playback downloads, appearance, and account</p>
        </div>
      </div>

      <section className="surface space-y-4 rounded-2xl p-5 sm:p-6">
        <div>
          <h2 className="font-sans text-base font-bold text-mist">Downloads</h2>
          <p className="mt-1 text-sm text-ink-400">
            Playlist tracks are always saved on the VPS. This only controls caching on this device.
          </p>
        </div>
        <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
          <div className="flex min-w-0 items-start gap-3">
            <Download className="mt-0.5 h-5 w-5 shrink-0 text-signal" />
            <div className="min-w-0">
              <p className="font-semibold text-mist">Auto-download playlist songs locally</p>
              <p className="mt-1 text-xs text-ink-400">
                When on, completed playlist downloads are also stored in this browser for offline play.
                Turning this off does not stop VPS downloads.
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={autoLocalPlaylist}
            onClick={() => onAutoLocalPlaylistChange(!autoLocalPlaylist)}
            className={`relative mt-1 h-7 w-12 shrink-0 rounded-full transition ${
              autoLocalPlaylist ? 'bg-signal' : 'bg-ink-700'
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                autoLocalPlaylist ? 'left-5' : 'left-0.5'
              }`}
            />
          </button>
        </label>
      </section>

      <section className="surface space-y-4 rounded-2xl p-5 sm:p-6">
        <div>
          <h2 className="font-sans text-base font-bold text-mist">Appearance</h2>
          <p className="mt-1 text-sm text-ink-400">Switch between dark and light mode.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onThemeChange('dark')}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
              theme === 'dark'
                ? 'border-signal/50 bg-signal/15 text-signal'
                : 'border-white/10 bg-white/[0.03] text-ink-300 hover:border-white/20'
            }`}
          >
            <Moon className="h-4 w-4" />
            Dark
          </button>
          <button
            type="button"
            onClick={() => onThemeChange('light')}
            className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm font-semibold transition ${
              theme === 'light'
                ? 'border-signal/50 bg-signal/15 text-signal'
                : 'border-white/10 bg-white/[0.03] text-ink-300 hover:border-white/20'
            }`}
          >
            <Sun className="h-4 w-4" />
            Light
          </button>
        </div>
      </section>

      <section className="surface space-y-4 rounded-2xl p-5 sm:p-6">
        <div>
          <h2 className="font-sans text-base font-bold text-mist">Account</h2>
          <p className="mt-1 text-sm text-ink-400">Update your profile or password.</p>
        </div>

        {!user || !token ? (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-8 text-center">
            <p className="text-sm text-ink-400">Sign in to manage your account.</p>
            <button type="button" onClick={onOpenAuth} className="btn-signal mt-4 rounded-xl px-5 py-2.5 text-sm">
              Sign in
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={saveProfile} className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-400">
                Display name
                <div className="relative mt-1.5">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="field w-full rounded-xl py-3 pl-10 pr-4 text-sm"
                  />
                </div>
              </label>
              <label className="block text-xs font-semibold uppercase tracking-wide text-ink-400">
                Email
                <div className="relative mt-1.5">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="field w-full rounded-xl py-3 pl-10 pr-4 text-sm"
                  />
                </div>
              </label>
              {profileError && <p className="text-sm text-ember">{profileError}</p>}
              {profileMsg && <p className="text-sm text-signal">{profileMsg}</p>}
              <button type="submit" disabled={savingProfile} className="btn-signal rounded-xl px-5 py-2.5 text-sm">
                {savingProfile ? 'Saving…' : 'Save profile'}
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] pt-4">
              <button
                type="button"
                onClick={onOpenPasswordModal}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-mist transition hover:border-signal/40 hover:text-signal"
              >
                <Lock className="h-4 w-4" />
                Update password
              </button>
              <button
                type="button"
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-xl border border-ember/25 bg-ember/10 px-4 py-2.5 text-sm font-semibold text-ember transition hover:bg-ember/20"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
