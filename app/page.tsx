'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Search, Music2, History, ListMusic, Sparkles } from 'lucide-react';
import Navbar from './components/Navbar';
import TrackCard from './components/TrackCard';
import PlayerBar from './components/PlayerBar';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import DownloadDrawer from './components/DownloadDrawer';
import {
  API_BASE,
  DownloadTask,
  MediaItem,
  PlayHistory,
  Playlist,
  User,
  fetchWithAuth,
} from './lib/api';

const CATEGORIES = ['All', 'Music', 'Podcasts', 'Jazz', 'Electronic', 'Rock', 'Hip Hop'];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'player' | 'admin' | 'playlists' | 'history'>('player');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MediaItem | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [history, setHistory] = useState<PlayHistory[]>([]);
  const [downloads, setDownloads] = useState<DownloadTask[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('riwu_token');
    const savedUser = localStorage.getItem('riwu_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleAuthSuccess = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('riwu_token', newToken);
    localStorage.setItem('riwu_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('riwu_token');
    localStorage.removeItem('riwu_user');
    setActiveTab('player');
  };

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `${API_BASE}/media/search?q=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(activeCategory)}`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || data || []);
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, activeCategory, token]);

  const loadPlaylists = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchWithAuth('/playlists', token);
      setPlaylists(data);
    } catch (err) {
      console.error('Failed to load playlists:', err);
    }
  }, [token]);

  const loadHistory = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchWithAuth('/history', token);
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  }, [token]);

  const loadDownloads = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchWithAuth('/downloads', token);
      setDownloads(data);
    } catch (err) {
      console.error('Failed to load downloads:', err);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      loadPlaylists();
      loadHistory();
      loadDownloads();
    }
  }, [token, loadPlaylists, loadHistory, loadDownloads]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (token && downloads.some((d) => ['pending', 'downloading', 'converting'].includes(d.status))) {
        loadDownloads();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [token, downloads, loadDownloads]);

  const handlePlay = async (track: MediaItem) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
    } else {
      setCurrentTrack(track);
      setIsPlaying(true);
    }

    if (token) {
      try {
        await fetchWithAuth('/history', token, {
          method: 'POST',
          body: JSON.stringify({
            track_id: track.id,
            track_title: track.title,
            track_artist: track.artist,
            thumbnail_url: track.thumbnail_url,
            source: track.source,
            duration_played: 0,
          }),
        });
        loadHistory();
      } catch {
        // non-blocking
      }
    }
  };

  const handleDownload = async (track: MediaItem) => {
    if (!token) {
      setShowAuth(true);
      return;
    }
    try {
      await fetchWithAuth('/downloads', token, {
        method: 'POST',
        body: JSON.stringify({
          track_id: track.id,
          title: track.title,
          artist: track.artist,
          source: track.source,
          source_url: track.source_url,
          format: 'mp3',
        }),
      });
      loadDownloads();
      setShowDownloads(true);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Download failed');
    }
  };

  const handleAddToPlaylist = async (track: MediaItem) => {
    if (!token) {
      setShowAuth(true);
      return;
    }
    try {
      let playlistId = playlists[0]?.id;
      if (!playlistId) {
        const created = await fetchWithAuth('/playlists', token, {
          method: 'POST',
          body: JSON.stringify({ name: 'My Favorites', description: 'Saved tracks' }),
        });
        playlistId = created.id;
        loadPlaylists();
      }
      await fetchWithAuth('/playlists/items', token, {
        method: 'POST',
        body: JSON.stringify({ playlist_id: playlistId, track_id: track.id }),
      });
      loadPlaylists();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to add to playlist');
    }
  };

  const pendingCount = downloads.filter((d) =>
    ['pending', 'downloading', 'converting'].includes(d.status)
  ).length;

  return (
    <div className="min-h-screen bg-[#090b10] relative">
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none animate-glow" />
      <div className="fixed bottom-1/4 right-1/4 w-80 h-80 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none animate-glow" />

      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setShowAuth(true)}
        onOpenDownloads={() => setShowDownloads(true)}
        onLogout={handleLogout}
        pendingDownloadsCount={pendingCount}
      />

      <main className="max-w-7xl mx-auto px-4 lg:px-8 py-6 pb-32">
        {activeTab === 'player' && (
          <div className="space-y-8">
            {/* Hero Banner */}
            <section className="glass-panel rounded-3xl p-6 lg:p-10 border border-white/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-transparent" />
              <div className="relative z-10 max-w-2xl">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span className="text-xs font-bold uppercase tracking-widest text-purple-300">
                    Modular Audio Engine
                  </span>
                </div>
                <h1 className="text-3xl lg:text-5xl font-extrabold text-white mb-3">
                  Stream from YouTube, GDrive &amp; Local
                </h1>
                <p className="text-slate-300 text-sm lg:text-base mb-6">
                  Search across plugin media sources, stream instantly, and queue background downloads
                  for offline playback — all powered by the riwu-music Go backend.
                </p>
              </div>
            </section>

            {/* Search Bar */}
            <section className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search tracks, artists, albums..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && performSearch()}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-slate-900/80 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                <button
                  onClick={performSearch}
                  disabled={isSearching}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg shadow-purple-600/30 hover:opacity-90 transition disabled:opacity-50"
                >
                  {isSearching ? 'Searching...' : 'Search'}
                </button>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                      activeCategory === cat
                        ? 'bg-white text-slate-900 shadow-lg'
                        : 'glass-pill text-slate-400 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>

            {/* Search Results Grid */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Music2 className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold text-white">
                  {searchResults.length > 0 ? 'Search Results' : 'Popular Tracks'}
                </h2>
              </div>

              {searchResults.length === 0 && !isSearching ? (
                <div className="glass-panel rounded-2xl p-12 text-center border border-white/10">
                  <Search className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400">Search for music across all active media modules</p>
                  <p className="text-xs text-slate-500 mt-2">
                    Try &quot;melody&quot;, &quot;jazz&quot;, or &quot;electronic&quot;
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {searchResults.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      isPlaying={currentTrack?.id === track.id && isPlaying}
                      onPlay={handlePlay}
                      onDownload={handleDownload}
                      onAddToPlaylist={handleAddToPlaylist}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'playlists' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <ListMusic className="w-6 h-6 text-purple-400" />
              <h1 className="text-2xl font-bold text-white">Your Playlists</h1>
            </div>
            {!token ? (
              <div className="glass-panel rounded-2xl p-12 text-center border border-white/10">
                <p className="text-slate-400">Sign in to view and manage playlists</p>
                <button
                  onClick={() => setShowAuth(true)}
                  className="mt-4 px-6 py-2 rounded-xl bg-purple-600 text-white font-semibold"
                >
                  Sign In
                </button>
              </div>
            ) : playlists.length === 0 ? (
              <div className="glass-panel rounded-2xl p-12 text-center border border-white/10">
                <p className="text-slate-400">No playlists yet. Add tracks from search results.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playlists.map((pl) => (
                  <div
                    key={pl.id}
                    className="glass-panel rounded-2xl p-5 border border-white/10 hover:border-purple-500/30 transition"
                  >
                    <h3 className="font-bold text-white text-lg">{pl.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{pl.description}</p>
                    <p className="text-sm text-purple-400 mt-3 font-mono">{pl.item_count} tracks</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex items-center gap-2">
              <History className="w-6 h-6 text-cyan-400" />
              <h1 className="text-2xl font-bold text-white">Play History</h1>
            </div>
            {!token ? (
              <div className="glass-panel rounded-2xl p-12 text-center border border-white/10">
                <p className="text-slate-400">Sign in to view your listening history</p>
              </div>
            ) : history.length === 0 ? (
              <div className="glass-panel rounded-2xl p-12 text-center border border-white/10">
                <p className="text-slate-400">No play history yet. Start streaming!</p>
              </div>
            ) : (
              <div className="glass-panel rounded-2xl border border-white/10 overflow-hidden">
                <table className="w-full text-sm text-slate-300">
                  <thead className="text-xs text-slate-400 uppercase bg-slate-900/80 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3 text-left">Track</th>
                      <th className="px-4 py-3 text-left">Artist</th>
                      <th className="px-4 py-3 text-left">Source</th>
                      <th className="px-4 py-3 text-right">Played At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {history.map((h) => (
                      <tr key={h.id} className="hover:bg-white/5 transition">
                        <td className="px-4 py-3 font-semibold text-white">{h.track_title}</td>
                        <td className="px-4 py-3 text-slate-400">{h.track_artist}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 border border-white/10">
                            {h.source}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-xs font-mono text-slate-500">
                          {new Date(h.played_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'admin' && user?.role === 'admin' && <AdminPanel token={token} />}
      </main>

      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onDownloadTrack={handleDownload}
      />

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      <DownloadDrawer
        isOpen={showDownloads}
        onClose={() => setShowDownloads(false)}
        downloads={downloads}
      />
    </div>
  );
}
