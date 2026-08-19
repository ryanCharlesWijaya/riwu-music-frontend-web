'use client';

import React from 'react';
import { Music, Shield, Download, History, ListMusic, LogIn, LogOut, User, Radio, Sparkles } from 'lucide-react';
import { User as UserType } from '../lib/api';

interface NavbarProps {
  user: UserType | null;
  activeTab: 'player' | 'admin' | 'playlists' | 'history';
  setActiveTab: (tab: 'player' | 'admin' | 'playlists' | 'history') => void;
  onOpenAuth: () => void;
  onOpenDownloads: () => void;
  onLogout: () => void;
  pendingDownloadsCount: number;
}

export default function Navbar({
  user,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onOpenDownloads,
  onLogout,
  pendingDownloadsCount,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-white/10 px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <div 
          onClick={() => setActiveTab('player')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-0.5 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Music className="w-5 h-5 text-purple-400 group-hover:rotate-12 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                riwu-music
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" /> v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">Modular Audio Engine & Cloud Offloader</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 sm:gap-2 bg-slate-900/60 p-1 rounded-xl border border-white/5">
          <button
            onClick={() => setActiveTab('player')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'player'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Stream Player</span>
          </button>

          <button
            onClick={() => setActiveTab('playlists')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'playlists'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ListMusic className="w-4 h-4" />
            <span className="hidden sm:inline">Playlists</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* Admin Control Center Tab (RBAC Protected) */}
          {user?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'admin'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                  : 'text-amber-400 hover:text-white hover:bg-amber-500/10'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Download Queue Drawer Button */}
          <button
            onClick={onOpenDownloads}
            className="relative p-2 rounded-xl bg-slate-900/80 border border-white/10 hover:border-purple-500/50 text-slate-300 hover:text-white transition-all"
            title="Async Download Worker Queue"
          >
            <Download className="w-5 h-5 text-cyan-400" />
            {pendingDownloadsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg animate-pulse">
                {pendingDownloadsCount}
              </span>
            )}
          </button>

          {/* Auth Button / Profile */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10">
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-xs">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-left hidden md:block">
                  <div className="text-xs font-semibold text-white leading-none">{user.name}</div>
                  <div className="text-[10px] text-purple-400 font-mono capitalize">{user.role}</div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-purple-600/30 hover:opacity-90 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
