'use client';

import React from 'react';
import {
  Music,
  Shield,
  Download,
  History,
  ListMusic,
  LogIn,
  LogOut,
  Radio,
  Settings,
} from 'lucide-react';
import { Playlist, User as UserType } from '../lib/api';

type AppTab = 'player' | 'admin' | 'playlists' | 'history' | 'downloads' | 'settings';

interface NavbarProps {
  user: UserType | null;
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  onSelectPlaylist: (playlistId: string) => void;
  downloadsCount: number;
  onOpenAuth: () => void;
  onOpenDownloads: () => void;
  onLogout: () => void;
  pendingDownloadsCount: number;
}

export default function Navbar({
  user,
  activeTab,
  setActiveTab,
  playlists,
  selectedPlaylistId,
  onSelectPlaylist,
  downloadsCount,
  onOpenAuth,
  onOpenDownloads,
  onLogout,
  pendingDownloadsCount,
}: NavbarProps) {
  const navBtn = (active: boolean) =>
    `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
      active
        ? 'bg-signal text-ink-950 shadow-lift'
        : 'text-ink-300 hover:text-mist hover:bg-white/[0.04]'
    }`;

  const mobileTab = (active: boolean) =>
    `relative flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-semibold transition ${
      active ? 'text-signal' : 'text-ink-400'
    }`;

  return (
    <>
      {/* Mobile top bar — brand + account only */}
      <header className="fixed left-0 right-0 top-0 z-40 border-b border-white/[0.06] bg-ink-950/90 backdrop-blur-xl lg:hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => setActiveTab('player')}
            className="flex min-w-0 items-center gap-2.5 text-left"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-signal text-ink-950">
              <Music className="h-4 w-4" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <div className="truncate font-display text-base font-extrabold tracking-tight text-mist">
                riwu<span className="text-signal">-</span>music
              </div>
            </div>
          </button>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenDownloads}
              className="relative rounded-xl border border-white/[0.06] bg-ink-900/70 p-2 text-signal"
              title="Download queue"
            >
              <Download className="h-4 w-4" />
              {pendingDownloadsCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-ember px-1 text-[9px] font-bold text-white">
                  {pendingDownloadsCount}
                </span>
              )}
            </button>

            {user ? (
              <button
                type="button"
                onClick={() => setActiveTab('settings')}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-signal to-ember font-display text-xs font-bold text-ink-950"
                title={`Settings (${user.name})`}
              >
                {user.name.charAt(0).toUpperCase()}
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="btn-signal flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom tabs */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-[45] border-t border-white/[0.08] bg-ink-950/95 backdrop-blur-xl lg:hidden"
        style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-stretch">
          <button type="button" onClick={() => setActiveTab('player')} className={mobileTab(activeTab === 'player')}>
            <Radio className="h-5 w-5" />
            Stream
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('downloads')}
            className={mobileTab(activeTab === 'downloads')}
          >
            <span className="relative">
              <Download className="h-5 w-5" />
              {downloadsCount > 0 && (
                <span className="absolute -right-2.5 -top-1 rounded-full bg-signal px-1 text-[8px] font-bold text-ink-950">
                  {downloadsCount > 99 ? '99+' : downloadsCount}
                </span>
              )}
            </span>
            Library
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('playlists')}
            className={mobileTab(activeTab === 'playlists')}
          >
            <ListMusic className="h-5 w-5" />
            Lists
          </button>
          <button type="button" onClick={() => setActiveTab('history')} className={mobileTab(activeTab === 'history')}>
            <History className="h-5 w-5" />
            History
          </button>
          {user?.role === 'admin' && (
            <button type="button" onClick={() => setActiveTab('admin')} className={mobileTab(activeTab === 'admin')}>
              <Shield className="h-5 w-5" />
              Admin
            </button>
          )}
        </div>
      </nav>

      {/* Desktop sidebar */}
      <header className="fixed top-0 left-0 z-40 hidden h-[100dvh] w-[17.5rem] border-r border-white/[0.06] bg-ink-950/80 backdrop-blur-xl lg:block">
        <div className="flex h-full w-full flex-col overflow-hidden px-5 py-6">
          <button
            type="button"
            onClick={() => setActiveTab('player')}
            className="group flex min-w-0 flex-shrink-0 items-center gap-3 text-left"
          >
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-signal text-ink-950 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
              <Music className="h-5 w-5" strokeWidth={2.4} />
            </div>
            <div className="min-w-0">
              <div className="font-display text-xl font-extrabold tracking-tight text-mist">
                riwu<span className="text-signal">-</span>music
              </div>
              <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-ink-400">Signal room</p>
            </div>
          </button>

          <nav className="mt-8 flex min-h-0 flex-1 flex-col items-stretch gap-1.5 overflow-y-auto">
            <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-500">Listen</p>
            <button type="button" onClick={() => setActiveTab('player')} className={navBtn(activeTab === 'player')}>
              <Radio className="h-4 w-4" />
              <span>Stream</span>
            </button>

            <p className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-500">Library</p>
            <button
              type="button"
              onClick={() => setActiveTab('downloads')}
              className={navBtn(activeTab === 'downloads')}
            >
              <Download className="h-4 w-4" />
              <span className="whitespace-nowrap">Downloads</span>
              {downloadsCount > 0 && (
                <span className="ml-auto font-mono text-[10px] opacity-70">{downloadsCount}</span>
              )}
            </button>

            <p className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-500">Playlists</p>
            <button
              type="button"
              onClick={() => setActiveTab('playlists')}
              className={navBtn(activeTab === 'playlists' && !selectedPlaylistId)}
            >
              <ListMusic className="h-4 w-4" />
              <span className="whitespace-nowrap">All playlists</span>
            </button>

            <div className="flex flex-col gap-0.5 px-1">
              {playlists.length === 0 ? (
                <p className="px-3 py-2 text-xs text-ink-500">
                  {user ? 'No playlists yet' : 'Sign in to see playlists'}
                </p>
              ) : (
                playlists.map((pl) => (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => onSelectPlaylist(pl.id)}
                    className={`w-full truncate rounded-xl px-3 py-2 text-left text-sm transition ${
                      selectedPlaylistId === pl.id && activeTab === 'playlists'
                        ? 'bg-white/[0.07] text-mist'
                        : 'text-ink-400 hover:bg-white/[0.04] hover:text-mist'
                    }`}
                    title={pl.name}
                  >
                    <span className="block truncate">{pl.name}</span>
                    <span className="block font-mono text-[10px] text-ink-500">{pl.item_count} songs</span>
                  </button>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`${navBtn(activeTab === 'history')} mt-3`}
            >
              <History className="h-4 w-4" />
              <span>History</span>
            </button>

            <p className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-500">System</p>
            {user?.role === 'admin' && (
              <button type="button" onClick={() => setActiveTab('admin')} className={navBtn(activeTab === 'admin')}>
                <Shield className="h-4 w-4" />
                <span>Admin</span>
              </button>
            )}
            <button type="button" onClick={() => setActiveTab('settings')} className={navBtn(activeTab === 'settings')}>
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
          </nav>

          <div className="mt-auto flex flex-col items-stretch gap-2 rounded-2xl border border-white/[0.06] bg-ink-900/60 p-3">
            <button
              type="button"
              onClick={onOpenDownloads}
              className="relative flex w-full items-center gap-2 rounded-xl border border-white/[0.06] bg-ink-900/70 px-3 py-2.5 text-ink-200 transition hover:border-signal/40 hover:text-signal"
              title="Download queue"
            >
              <Download className="h-4 w-4 text-signal" />
              <span className="text-xs font-semibold">Download queue</span>
              {pendingDownloadsCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold text-white">
                  {pendingDownloadsCount}
                </span>
              )}
            </button>

            {user ? (
              <div className="flex w-full items-center gap-2">
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/[0.06] bg-ink-900/70 px-2.5 py-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-signal to-ember font-display text-xs font-bold text-ink-950">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 text-left">
                    <div className="truncate text-xs font-semibold text-mist">{user.name}</div>
                    <div className="font-mono text-[10px] capitalize text-signal/80">{user.role}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="self-stretch rounded-xl border border-ember/25 bg-ember/10 p-2 text-ember transition hover:bg-ember/20"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="btn-signal flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm"
              >
                <LogIn className="h-4 w-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
