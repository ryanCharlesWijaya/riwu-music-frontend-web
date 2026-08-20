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

interface NavbarProps {
  user: UserType | null;
  activeTab: 'player' | 'admin' | 'playlists' | 'history';
  setActiveTab: (tab: 'player' | 'admin' | 'playlists' | 'history') => void;
  playlists: Playlist[];
  selectedPlaylistId: string | null;
  onSelectPlaylist: (playlistId: string) => void;
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

  return (
    <header className="fixed top-0 left-0 z-40 w-full border-b border-white/[0.06] bg-ink-950/80 backdrop-blur-xl lg:w-[17.5rem] lg:h-[100dvh] lg:border-r lg:border-b-0">
      <div className="mx-auto flex w-full items-center justify-between gap-3 px-4 py-3 lg:h-full lg:flex-col lg:items-stretch lg:overflow-hidden lg:px-5 lg:py-6">
        <button
          type="button"
          onClick={() => setActiveTab('player')}
          className="group flex min-w-0 flex-shrink-0 items-center gap-3 text-left"
        >
          <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-signal text-ink-950 transition-transform duration-300 group-hover:rotate-6 group-hover:scale-105">
            <Music className="h-5 w-5" strokeWidth={2.4} />
          </div>
          <div className="min-w-0">
            <div className="font-display text-lg font-extrabold tracking-tight text-mist sm:text-xl">
              riwu<span className="text-signal">-</span>music
            </div>
            <p className="mt-0.5 hidden text-[11px] uppercase tracking-[0.16em] text-ink-400 lg:block">
              Signal room
            </p>
          </div>
        </button>

        <nav className="flex max-w-[55vw] items-center gap-1 overflow-x-auto sm:max-w-none sm:gap-1.5 lg:mt-8 lg:max-w-none lg:flex-1 lg:min-h-0 lg:flex-col lg:items-stretch lg:gap-1.5 lg:overflow-y-auto">
          <p className="mb-1 hidden px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-500 lg:block">
            Listen
          </p>
          <button type="button" onClick={() => setActiveTab('player')} className={navBtn(activeTab === 'player')}>
            <Radio className="h-4 w-4" />
            <span>Stream</span>
          </button>

          <p className="mb-1 mt-4 hidden px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-500 lg:block">
            Playlists
          </p>
          <button
            type="button"
            onClick={() => setActiveTab('playlists')}
            className={navBtn(activeTab === 'playlists' && !selectedPlaylistId)}
          >
            <ListMusic className="h-4 w-4" />
            <span className="whitespace-nowrap">All playlists</span>
          </button>

          <div className="hidden lg:flex lg:flex-col lg:gap-0.5 lg:px-1">
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
            className={`${navBtn(activeTab === 'history')} lg:mt-3`}
          >
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">History</span>
          </button>

          <p className="mb-1 mt-4 hidden px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-500 lg:block">
            System
          </p>
          {user?.role === 'admin' && (
            <button type="button" onClick={() => setActiveTab('admin')} className={navBtn(activeTab === 'admin')}>
              <Shield className="h-4 w-4" />
              <span>Admin</span>
            </button>
          )}
          <button
            type="button"
            disabled
            title="Settings coming soon"
            className="flex cursor-not-allowed items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden lg:inline">Settings</span>
          </button>
        </nav>

        <div className="flex flex-shrink-0 items-center gap-2 lg:mt-auto lg:flex-col lg:items-stretch lg:gap-2 lg:rounded-2xl lg:border lg:border-white/[0.06] lg:bg-ink-900/60 lg:p-3">
          <button
            type="button"
            onClick={onOpenDownloads}
            className="relative flex items-center gap-2 rounded-xl border border-white/[0.06] bg-ink-900/70 p-2.5 text-ink-200 transition hover:border-signal/40 hover:text-signal lg:w-full lg:px-3"
            title="Offline library"
          >
            <Download className="h-4 w-4 text-signal" />
            <span className="hidden text-xs font-semibold lg:inline">Offline library</span>
            {pendingDownloadsCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-ember px-1 text-[10px] font-bold text-white">
                {pendingDownloadsCount}
              </span>
            )}
          </button>

          {user ? (
            <div className="flex items-center gap-2 lg:w-full">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/[0.06] bg-ink-900/70 px-2.5 py-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-signal to-ember font-display text-xs font-bold text-ink-950">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="hidden min-w-0 text-left md:block">
                  <div className="truncate text-xs font-semibold text-mist">{user.name}</div>
                  <div className="font-mono text-[10px] capitalize text-signal/80">{user.role}</div>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-xl border border-ember/25 bg-ember/10 p-2 text-ember transition hover:bg-ember/20 lg:self-stretch"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuth}
              className="btn-signal flex w-auto items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm lg:w-full"
            >
              <LogIn className="h-4 w-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
