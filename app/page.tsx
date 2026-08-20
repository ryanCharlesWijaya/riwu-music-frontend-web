'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, History, ListMusic, Download } from 'lucide-react';
import Navbar from './components/Navbar';
import TrackCard from './components/TrackCard';
import PlayerBar from './components/PlayerBar';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import DownloadDrawer from './components/DownloadDrawer';
import PlaylistPicker from './components/PlaylistPicker';
import QueueDrawer from './components/QueueDrawer';
import {
  API_BASE,
  DownloadTask,
  MediaItem,
  PlayHistory,
  Playlist,
  User,
  cacheDownloadForOffline,
  fetchRadio,
  fetchWithAuth,
  latestDownloadByTrack,
  prefetchTracks,
} from './lib/api';
import { listOfflineTrackIds, listOfflineTracks, OfflineTrackMeta, updateOfflineTrackMeta } from './lib/offlineStore';
import {
  cacheDownloads,
  cachePlaylistTracks,
  cachePlaylists,
  clearUserLocalCache,
  readCachedDownloads,
  readCachedPlaylistTracks,
  readCachedPlaylists,
} from './lib/localCache';

type QueueState = {
  tracks: MediaItem[];
  index: number;
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'player' | 'admin' | 'playlists' | 'history' | 'downloads'>('player');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [queueState, setQueueState] = useState<QueueState>({ tracks: [], index: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<MediaItem[]>([]);
  const [loadingPlaylistTracks, setLoadingPlaylistTracks] = useState(false);
  const [history, setHistory] = useState<PlayHistory[]>([]);
  const [downloads, setDownloads] = useState<DownloadTask[]>([]);
  const [showAuth, setShowAuth] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);
  const [playlistTrack, setPlaylistTrack] = useState<MediaItem | null>(null);
  const [offlineTrackIds, setOfflineTrackIds] = useState<Set<string>>(new Set());
  const [offlineTracks, setOfflineTracks] = useState<OfflineTrackMeta[]>([]);
  const [autoPlay, setAutoPlay] = useState(true);
  const historyQueuedRef = useRef(false);
  const playlistsQueuedRef = useRef(false);
  const cachingRef = useRef<Set<string>>(new Set());
  const lastHistoryTrackRef = useRef<string | null>(null);
  const radioFetchRef = useRef(false);

  const currentTrack = queueState.tracks[queueState.index] ?? null;
  const canSkipPrev = queueState.index > 0;
  const canSkipNext = queueState.index < queueState.tracks.length - 1;

  const downloadsByTrack = useMemo(() => latestDownloadByTrack(downloads), [downloads]);

  const downloadedLibrary = useMemo(() => {
    const byId = new Map<string, MediaItem>();

    for (const task of downloads) {
      if (task.status !== 'completed') continue;
      const videoId = task.track_id.startsWith('yt_') ? task.track_id.slice(3) : '';
      byId.set(task.track_id, {
        id: task.track_id,
        title: task.title || task.track_id,
        artist: task.artist || 'Unknown',
        album: 'Downloads',
        duration: 0,
        bitrate: 0,
        format: task.format || 'm4a',
        source: (task.source as MediaItem['source']) || 'youtube',
        source_url: task.source_url || (videoId ? `https://www.youtube.com/watch?v=${videoId}` : ''),
        thumbnail_url: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '',
        file_size: task.file_size || 0,
        created_at: task.completed_at || task.created_at,
      });
    }

    for (const offline of offlineTracks) {
      if (byId.has(offline.trackId)) continue;
      const videoId = offline.trackId.startsWith('yt_') ? offline.trackId.slice(3) : '';
      byId.set(offline.trackId, {
        id: offline.trackId,
        title: offline.title || offline.trackId,
        artist: offline.artist || 'Unknown',
        album: 'Downloads',
        duration: 0,
        bitrate: 0,
        format: 'm4a',
        source: offline.trackId.startsWith('yt_')
          ? 'youtube'
          : offline.trackId.startsWith('gdrive_')
            ? 'gdrive'
            : 'local',
        source_url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : '',
        thumbnail_url: videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : '',
        file_size: offline.size || 0,
        created_at: new Date(offline.cachedAt).toISOString(),
      });
    }

    return Array.from(byId.values()).sort((a, b) => a.title.localeCompare(b.title));
  }, [downloads, offlineTracks]);

  const refreshOfflineIds = useCallback(async () => {
    const [ids, tracks] = await Promise.all([listOfflineTrackIds(), listOfflineTracks()]);
    setOfflineTrackIds(new Set(ids));
    setOfflineTracks(tracks);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('riwu_autoplay');
    if (saved === '0') setAutoPlay(false);
    if (saved === '1') setAutoPlay(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('riwu_autoplay', autoPlay ? '1' : '0');
  }, [autoPlay]);

  useEffect(() => {
    void refreshOfflineIds();
    setPlaylists(readCachedPlaylists());
    setDownloads(readCachedDownloads());
  }, [refreshOfflineIds]);

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
    clearUserLocalCache();
    setActiveTab('player');
    setSelectedPlaylistId(null);
    setPlaylistTracks([]);
    setPlaylists([]);
    setDownloads([]);
  };

  const changeTab = (tab: 'player' | 'admin' | 'playlists' | 'history' | 'downloads') => {
    setActiveTab(tab);
    if (tab !== 'playlists') {
      setSelectedPlaylistId(null);
      setPlaylistTracks([]);
    } else {
      setSelectedPlaylistId(null);
      setPlaylistTracks([]);
    }
  };

  const loadPlaylistTracks = useCallback(
    async (playlistId: string) => {
      if (!token) {
        setPlaylistTracks(readCachedPlaylistTracks(playlistId));
        return;
      }
      setLoadingPlaylistTracks(true);
      try {
        const data = await fetchWithAuth(
          `/playlists/detail?id=${encodeURIComponent(playlistId)}`,
          token
        );
        const items = Array.isArray(data?.items) ? data.items : [];
        const tracks: MediaItem[] = items
          .map((item: { track?: MediaItem; track_id?: string }) => item.track)
          .filter((t: MediaItem | undefined): t is MediaItem => !!t);
        setPlaylistTracks(tracks);
        cachePlaylistTracks(playlistId, tracks);
        void prefetchTracks(tracks.map((t) => t.id));
      } catch (err) {
        console.error('Failed to load playlist tracks:', err);
        setPlaylistTracks(readCachedPlaylistTracks(playlistId));
      } finally {
        setLoadingPlaylistTracks(false);
      }
    },
    [token]
  );

  const openPlaylist = useCallback(
    (playlistId: string) => {
      setActiveTab('playlists');
      setSelectedPlaylistId(playlistId);
      void loadPlaylistTracks(playlistId);
    },
    [loadPlaylistTracks]
  );

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setActiveTab('player');
    setSelectedPlaylistId(null);
    setIsSearching(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(
        `${API_BASE}/media/search?q=${encodeURIComponent(searchQuery)}`,
        { headers }
      );
      if (res.ok) {
        const data = await res.json();
        const results = data.results || data || [];
        setSearchResults(results);
        void prefetchTracks(results.map((track: MediaItem) => track.id));
      }
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, token]);

  const loadPlaylists = useCallback(async () => {
    if (!token) {
      setPlaylists(readCachedPlaylists());
      return;
    }
    try {
      const data = await fetchWithAuth('/playlists', token);
      const list = Array.isArray(data) ? data : [];
      setPlaylists(list);
      cachePlaylists(list);
      // Warm each playlist's tracks into local cache for offline browsing.
      void Promise.all(
        list.map(async (pl) => {
          try {
            const detail = await fetchWithAuth(
              `/playlists/detail?id=${encodeURIComponent(pl.id)}`,
              token
            );
            const items = Array.isArray(detail?.items) ? detail.items : [];
            const tracks: MediaItem[] = items
              .map((item: { track?: MediaItem }) => item.track)
              .filter((t: MediaItem | undefined): t is MediaItem => !!t);
            cachePlaylistTracks(pl.id, tracks);
          } catch {
            // keep any existing cache for this playlist
          }
        })
      );
    } catch (err) {
      console.error('Failed to load playlists:', err);
      setPlaylists(readCachedPlaylists());
    }
  }, [token]);

  const loadHistory = useCallback(async (): Promise<PlayHistory[]> => {
    if (!token) return [];
    try {
      const data = await fetchWithAuth('/history', token);
      const items = Array.isArray(data) ? (data as PlayHistory[]) : [];
      setHistory(items);
      return items;
    } catch (err) {
      console.error('Failed to load history:', err);
      return [];
    }
  }, [token]);

  const loadDownloads = useCallback(async () => {
    if (!token) {
      setDownloads(readCachedDownloads());
      return;
    }
    try {
      const data = await fetchWithAuth('/downloads', token);
      const list = Array.isArray(data) ? data : [];
      setDownloads(list);
      cacheDownloads(list);
      // Keep offline IndexedDB titles in sync with real YouTube names.
      for (const task of list) {
        if (
          task.status === 'completed' &&
          task.title &&
          !String(task.title).toLowerCase().startsWith('youtube audio track')
        ) {
          void updateOfflineTrackMeta(task.track_id, {
            title: task.title,
            artist: task.artist || undefined,
          });
        }
      }
    } catch (err) {
      console.error('Failed to load downloads:', err);
      setDownloads(readCachedDownloads());
    }
  }, [token]);

  const queueHistoryDownloads = useCallback(
    async (items: PlayHistory[]) => {
      if (!token || items.length === 0) return;
      try {
        await fetchWithAuth('/downloads/history', token, {
          method: 'POST',
          body: JSON.stringify({
            tracks: items.map((h) => ({
              track_id: h.track_id,
              title: h.track_title,
              artist: h.track_artist,
              source: h.source || 'youtube',
              source_url: h.track_id.startsWith('yt_')
                ? `https://www.youtube.com/watch?v=${h.track_id.replace(/^yt_/, '')}`
                : '',
              format: 'm4a',
            })),
          }),
        });
        loadDownloads();
      } catch (err) {
        console.error('Failed to queue history downloads:', err);
      }
    },
    [token, loadDownloads]
  );

  const queuePlaylistDownloads = useCallback(
    async (playlistId?: string | null) => {
      if (!token) return;
      try {
        await fetchWithAuth('/downloads/playlist', token, {
          method: 'POST',
          body: JSON.stringify({ playlist_id: playlistId || '' }),
        });
        await loadDownloads();
      } catch (err) {
        console.error('Failed to queue playlist downloads:', err);
      }
    },
    [token, loadDownloads]
  );

  useEffect(() => {
    if (token) {
      loadPlaylists();
      loadDownloads();
      loadHistory().then((items) => {
        if (!historyQueuedRef.current && items.length > 0) {
          historyQueuedRef.current = true;
          void queueHistoryDownloads(items);
        }
      });
      if (!playlistsQueuedRef.current) {
        playlistsQueuedRef.current = true;
        void queuePlaylistDownloads(null);
      }
    } else {
      historyQueuedRef.current = false;
      playlistsQueuedRef.current = false;
    }
  }, [token, loadPlaylists, loadHistory, loadDownloads, queueHistoryDownloads, queuePlaylistDownloads]);

  // When VPS downloads complete, quietly cache them in IndexedDB for offline play.
  useEffect(() => {
    if (!token) return;
    for (const task of downloads) {
      if (task.status !== 'completed') continue;
      if (offlineTrackIds.has(task.track_id)) continue;
      if (cachingRef.current.has(task.track_id)) continue;
      cachingRef.current.add(task.track_id);
      void cacheDownloadForOffline(task, token)
        .then(() => refreshOfflineIds())
        .catch(console.error)
        .finally(() => cachingRef.current.delete(task.track_id));
    }
  }, [downloads, token, offlineTrackIds, refreshOfflineIds]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (token && downloads.some((d) => ['pending', 'downloading', 'converting'].includes(d.status))) {
        loadDownloads();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [token, downloads, loadDownloads]);

  const recordHistory = useCallback(
    async (track: MediaItem) => {
      if (!token) return;
      if (lastHistoryTrackRef.current === track.id) return;
      lastHistoryTrackRef.current = track.id;
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
        void loadHistory();
      } catch {
        // non-blocking
      }
    },
    [token, loadHistory]
  );

  useEffect(() => {
    if (currentTrack && isPlaying) {
      void recordHistory(currentTrack);
      void prefetchTracks(
        queueState.tracks.slice(queueState.index, queueState.index + 3).map((t) => t.id)
      );
    }
  }, [currentTrack?.id, isPlaying, recordHistory, queueState.tracks, queueState.index]);

  const handlePlay = (track: MediaItem) => {
    if (currentTrack?.id === track.id) {
      setIsPlaying(!isPlaying);
      return;
    }

    setQueueState((prev) => {
      const existing = prev.tracks.findIndex((t) => t.id === track.id);
      if (existing >= 0) {
        return { ...prev, index: existing };
      }
      if (prev.tracks.length === 0) {
        return { tracks: [track], index: 0 };
      }
      const tracks = [
        ...prev.tracks.slice(0, prev.index),
        track,
        ...prev.tracks.slice(prev.index + 1).filter((t) => t.id !== track.id),
      ];
      return { tracks, index: prev.index };
    });
    setIsPlaying(true);
  };

  const handleAddToQueue = (track: MediaItem) => {
    let startPlayback = false;
    setQueueState((prev) => {
      if (prev.tracks.length === 0) {
        startPlayback = true;
        return { tracks: [track], index: 0 };
      }
      if (prev.tracks.some((t) => t.id === track.id)) {
        return prev;
      }
      return { tracks: [...prev.tracks, track], index: prev.index };
    });
    if (startPlayback) setIsPlaying(true);
  };

  const playQueue = (tracks: MediaItem[], startIndex = 0) => {
    if (tracks.length === 0) return;
    setQueueState({ tracks, index: Math.min(startIndex, tracks.length - 1) });
    setIsPlaying(true);
  };

  const extendRadioQueue = useCallback(
    async (seed: MediaItem, existing: MediaItem[]) => {
      if (!seed.id.startsWith('yt_')) return [] as MediaItem[];
      try {
        const exclude = existing.map((t) => t.id);
        const next = await fetchRadio(
          { id: seed.id, artist: seed.artist, title: seed.title },
          exclude,
          6,
        );
        void prefetchTracks(next.map((t) => t.id));
        return next;
      } catch (err) {
        console.error('Autoplay radio failed:', err);
        return [] as MediaItem[];
      }
    },
    [],
  );

  const handleSkipNext = async () => {
    if (queueState.index < queueState.tracks.length - 1) {
      setQueueState((prev) => ({ ...prev, index: prev.index + 1 }));
      setIsPlaying(true);
      return;
    }
    if (!autoPlay) return;
    const seed = queueState.tracks[queueState.index];
    if (!seed) return;
    const next = await extendRadioQueue(seed, queueState.tracks);
    if (next.length === 0) return;
    setQueueState((prev) => ({
      tracks: [...prev.tracks, ...next],
      index: prev.index + 1,
    }));
    setIsPlaying(true);
  };

  const handleSkipPrev = () => {
    setQueueState((prev) => {
      if (prev.index <= 0) return prev;
      return { ...prev, index: prev.index - 1 };
    });
    setIsPlaying(true);
  };

  const handleTrackEnded = () => {
    const prev = queueState;
    if (prev.index < prev.tracks.length - 1) {
      setQueueState({ ...prev, index: prev.index + 1 });
      setIsPlaying(true);
      return;
    }

    if (!autoPlay) {
      setIsPlaying(false);
      return;
    }

    const seed = prev.tracks[prev.index];
    if (!seed) {
      setIsPlaying(false);
      return;
    }

    void (async () => {
      const next = await extendRadioQueue(seed, prev.tracks);
      if (next.length === 0) {
        setIsPlaying(false);
        return;
      }
      setQueueState({
        tracks: [...prev.tracks, ...next],
        index: prev.index + 1,
      });
      setIsPlaying(true);
    })();
  };

  // Keep a few radio tracks queued ahead while autoplay is on.
  useEffect(() => {
    if (!autoPlay || !isPlaying) return;
    const remaining = queueState.tracks.length - queueState.index - 1;
    if (remaining >= 2) return;
    const seed = queueState.tracks[queueState.index];
    if (!seed?.id.startsWith('yt_')) return;
    if (radioFetchRef.current) return;

    let cancelled = false;
    radioFetchRef.current = true;
    void (async () => {
      try {
        const next = await extendRadioQueue(seed, queueState.tracks);
        if (cancelled || next.length === 0) return;
        setQueueState((prev) => {
          const known = new Set(prev.tracks.map((t) => t.id));
          const fresh = next.filter((t) => !known.has(t.id));
          if (fresh.length === 0) return prev;
          return { ...prev, tracks: [...prev.tracks, ...fresh] };
        });
      } finally {
        radioFetchRef.current = false;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [autoPlay, isPlaying, queueState.index, queueState.tracks.length, extendRadioQueue]);

  const playAtQueueIndex = (index: number) => {
    setQueueState((prev) => {
      if (index < 0 || index >= prev.tracks.length) return prev;
      return { ...prev, index };
    });
    setIsPlaying(true);
  };

  const removeFromQueue = (index: number) => {
    setQueueState((prev) => {
      if (index < 0 || index >= prev.tracks.length) return prev;
      const tracks = prev.tracks.filter((_, i) => i !== index);
      if (tracks.length === 0) {
        setIsPlaying(false);
        return { tracks: [], index: 0 };
      }
      let nextIndex = prev.index;
      if (index < prev.index) nextIndex = prev.index - 1;
      else if (index === prev.index) nextIndex = Math.min(prev.index, tracks.length - 1);
      return { tracks, index: nextIndex };
    });
  };

  const clearQueue = () => {
    setQueueState({ tracks: [], index: 0 });
    setIsPlaying(false);
  };

  const handleDownload = async (track: MediaItem, options?: { silent?: boolean }) => {
    if (!token) {
      if (!options?.silent) setShowAuth(true);
      return;
    }
    try {
      const existing = downloadsByTrack[track.id];
      if (existing?.status === 'completed') {
        await cacheDownloadForOffline(existing, token);
        await refreshOfflineIds();
        if (!options?.silent) setShowDownloads(true);
        return;
      }

      await fetchWithAuth('/downloads', token, {
        method: 'POST',
        body: JSON.stringify({
          track_id: track.id,
          title: track.title,
          artist: track.artist,
          source: track.source,
          source_url: track.source_url,
          format: 'm4a',
        }),
      });
      await loadDownloads();
      if (!options?.silent) setShowDownloads(true);
    } catch (err: unknown) {
      if (!options?.silent) {
        alert(err instanceof Error ? err.message : 'Download failed');
      } else {
        console.error('Silent download failed:', err);
      }
    }
  };

  const handleAddToPlaylist = (track: MediaItem) => {
    if (!token) {
      setShowAuth(true);
      return;
    }
    setPlaylistTrack(track);
  };

  const addTrackToPlaylist = async (playlistId: string, track: MediaItem) => {
    if (!token) return;
    await fetchWithAuth('/playlists/items', token, {
      method: 'POST',
      body: JSON.stringify({
        playlist_id: playlistId,
        track_id: track.id,
        title: track.title,
        artist: track.artist,
        source: track.source,
        source_url: track.source_url,
        thumbnail_url: track.thumbnail_url,
        duration: track.duration,
      }),
    });
    await loadPlaylists();
    if (selectedPlaylistId === playlistId) {
      await loadPlaylistTracks(playlistId);
    }
    // Silently cache new playlist track on the VPS.
    void handleDownload(track, { silent: true });
  };

  const createPlaylistAndAdd = async (name: string, track: MediaItem) => {
    if (!token) return;
    const created = await fetchWithAuth('/playlists', token, {
      method: 'POST',
      body: JSON.stringify({ name, description: 'Created from search' }),
    });
    await addTrackToPlaylist(created.id, track);
  };

  const selectedPlaylist = playlists.find((p) => p.id === selectedPlaylistId) || null;

  const pendingCount = downloads.filter((d) =>
    ['pending', 'downloading', 'converting'].includes(d.status)
  ).length;

  return (
    <div className="app-shell">
      <Navbar
        user={user}
        activeTab={activeTab}
        setActiveTab={changeTab}
        playlists={playlists}
        selectedPlaylistId={selectedPlaylistId}
        onSelectPlaylist={openPlaylist}
        downloadsCount={downloadedLibrary.length}
        onOpenAuth={() => setShowAuth(true)}
        onOpenDownloads={() => setShowDownloads(true)}
        onLogout={handleLogout}
        pendingDownloadsCount={pendingCount}
      />

      <div className="app-content min-h-[100dvh] lg:pl-[17.5rem]">
        <div className="fixed left-0 right-0 top-[3.5rem] z-30 border-b border-white/[0.06] bg-ink-950/90 px-3 py-2.5 backdrop-blur-xl sm:px-4 lg:left-[17.5rem] lg:top-0 lg:px-8 lg:py-4">
          <div className="mx-auto flex w-full max-w-none items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-500 sm:left-4 sm:h-5 sm:w-5" />
              <input
                type="text"
                placeholder="Search songs or artists…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void performSearch()}
                className="field w-full rounded-xl py-2.5 pl-10 pr-3 text-sm sm:rounded-2xl sm:py-3.5 sm:pl-12 sm:pr-4 sm:text-base"
              />
            </div>
            <button
              type="button"
              onClick={() => void performSearch()}
              disabled={isSearching}
              className="btn-signal shrink-0 rounded-xl px-4 py-2.5 text-sm sm:rounded-2xl sm:px-7 sm:py-3.5 sm:text-base"
            >
              {isSearching ? '…' : 'Search'}
            </button>
          </div>
        </div>

        <main className="w-full px-3 pb-player pt-[7.25rem] sm:px-6 lg:px-8 lg:pt-[7.5rem]">
        {activeTab === 'player' && (
          <div className="space-y-6 lg:space-y-10">
            <section>
              <div className="mb-4 flex items-end justify-between gap-3 sm:mb-5">
                <div>
                  <h2 className="font-display text-xl font-bold text-mist sm:text-2xl">
                    {searchResults.length > 0 ? 'Search results' : 'Start searching'}
                  </h2>
                  <p className="mt-1 text-xs text-ink-400 sm:text-sm">
                    {searchResults.length > 0
                      ? `${searchResults.length} tracks ready to stream`
                      : 'Type a song or artist above to fill this list'}
                  </p>
                </div>
              </div>

              {searchResults.length === 0 && !isSearching ? (
                <div className="surface flex flex-col items-center justify-center rounded-[1.25rem] px-5 py-12 text-center sm:rounded-[1.5rem] sm:px-6 sm:py-16">
                  <Search className="mb-4 h-10 w-10 text-ink-600 sm:h-12 sm:w-12" />
                  <p className="font-display text-base font-semibold text-ink-300 sm:text-lg">No results yet</p>
                  <p className="mt-2 max-w-sm text-xs text-ink-500 sm:text-sm">
                    Try “jazz”, “lofi”, or an artist name — results warm up in the background as they appear.
                  </p>
                </div>
              ) : (
                <div className="stagger grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                  {searchResults.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      isPlaying={currentTrack?.id === track.id && isPlaying}
                      downloadTask={downloadsByTrack[track.id]}
                      isOfflineReady={offlineTrackIds.has(track.id)}
                      onPlay={handlePlay}
                      onDownload={handleDownload}
                      onAddToPlaylist={handleAddToPlaylist}
                      onAddToQueue={handleAddToQueue}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}

        {activeTab === 'downloads' && (
          <div className="space-y-6 animate-rise-in">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Download className="h-7 w-7 shrink-0 text-signal" />
                <div>
                  <h1 className="font-display text-2xl font-bold text-mist sm:text-3xl">Downloads</h1>
                  <p className="mt-1 text-sm text-ink-400">
                    {downloadedLibrary.length > 0
                      ? `${downloadedLibrary.length} songs ready offline`
                      : 'Completed downloads show up here'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {downloadedLibrary.length > 0 && (
                  <button
                    type="button"
                    onClick={() => playQueue(downloadedLibrary)}
                    className="btn-signal rounded-xl px-4 py-2 text-sm"
                  >
                    Play all
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowDownloads(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-ink-300 transition hover:border-signal/35 hover:text-signal"
                >
                  Download queue
                  {pendingCount > 0 && (
                    <span className="rounded-full bg-ember px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {downloadedLibrary.length === 0 ? (
              <div className="surface flex flex-col items-center justify-center rounded-[1.5rem] px-6 py-16 text-center">
                <Download className="mb-4 h-12 w-12 text-ink-600" />
                <p className="font-display text-lg font-semibold text-ink-300">No downloads yet</p>
                <p className="mt-2 max-w-sm text-sm text-ink-500">
                  Download tracks from search or playlists — they will appear in this library.
                </p>
              </div>
            ) : (
              <div className="stagger grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                {downloadedLibrary.map((track) => (
                  <TrackCard
                    key={track.id}
                    track={track}
                    isPlaying={currentTrack?.id === track.id && isPlaying}
                    downloadTask={downloadsByTrack[track.id]}
                    isOfflineReady={offlineTrackIds.has(track.id) || downloadsByTrack[track.id]?.status === 'completed'}
                    onPlay={handlePlay}
                    onDownload={handleDownload}
                    onAddToPlaylist={handleAddToPlaylist}
                    onAddToQueue={handleAddToQueue}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'playlists' && (
          <div className="space-y-6 animate-rise-in">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <ListMusic className="h-7 w-7 shrink-0 text-signal" />
                <h1 className="truncate font-display text-2xl font-bold text-mist sm:text-3xl">
                  {selectedPlaylist ? selectedPlaylist.name : 'Your Playlists'}
                </h1>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {selectedPlaylist && playlistTracks.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => playQueue(playlistTracks)}
                      className="btn-signal rounded-xl px-4 py-2 text-sm"
                    >
                      Play all
                    </button>
                    <button
                      type="button"
                      onClick={() => void queuePlaylistDownloads(selectedPlaylistId)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-signal/35 bg-signal/10 px-4 py-2 text-sm font-semibold text-signal transition hover:bg-signal/20"
                    >
                      <Download className="h-4 w-4" />
                      Download all
                    </button>
                  </>
                )}
                {!selectedPlaylist && token && playlists.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void queuePlaylistDownloads(null)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-signal/35 bg-signal/10 px-4 py-2 text-sm font-semibold text-signal transition hover:bg-signal/20"
                  >
                    <Download className="h-4 w-4" />
                    Download all playlists
                  </button>
                )}
                {selectedPlaylist && (
                  <button
                    type="button"
                    onClick={() => changeTab('playlists')}
                    className="text-sm text-ink-400 transition hover:text-mist"
                  >
                    ← All playlists
                  </button>
                )}
              </div>
            </div>
            {!token ? (
              <div className="surface rounded-[1.5rem] px-6 py-14 text-center">
                <p className="text-ink-400">Sign in to view and manage playlists</p>
                <button
                  type="button"
                  onClick={() => setShowAuth(true)}
                  className="btn-signal mt-4 rounded-xl px-6 py-2.5 text-sm"
                >
                  Sign In
                </button>
              </div>
            ) : selectedPlaylistId ? (
              loadingPlaylistTracks ? (
                <div className="surface rounded-[1.5rem] px-6 py-14 text-center text-ink-400">Loading tracks...</div>
              ) : playlistTracks.length === 0 ? (
                <div className="surface rounded-[1.5rem] px-6 py-14 text-center text-ink-400">
                  This playlist is empty. Add tracks from search.
                </div>
              ) : (
                <div className="stagger grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3 2xl:grid-cols-4">
                  {playlistTracks.map((track) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      isPlaying={currentTrack?.id === track.id && isPlaying}
                      downloadTask={downloadsByTrack[track.id]}
                      isOfflineReady={offlineTrackIds.has(track.id)}
                      onPlay={handlePlay}
                      onDownload={handleDownload}
                      onAddToPlaylist={handleAddToPlaylist}
                      onAddToQueue={handleAddToQueue}
                    />
                  ))}
                </div>
              )
            ) : playlists.length === 0 ? (
              <div className="surface rounded-[1.5rem] px-6 py-14 text-center text-ink-400">
                No playlists yet. Add tracks from search results.
              </div>
            ) : (
              <div className="stagger grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {playlists.map((pl) => (
                  <button
                    key={pl.id}
                    type="button"
                    onClick={() => openPlaylist(pl.id)}
                    className="surface rounded-2xl p-5 text-left transition hover:border-signal/35 hover:bg-ink-800/50"
                  >
                    <h3 className="font-display text-lg font-bold text-mist">{pl.name}</h3>
                    <p className="mt-1 text-xs text-ink-400">{pl.description || 'No description'}</p>
                    <p className="mt-4 font-mono text-sm text-signal">{pl.item_count} tracks</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6 animate-rise-in">
            <div className="flex items-center gap-3">
              <History className="h-7 w-7 text-ember" />
              <h1 className="font-display text-2xl font-bold text-mist sm:text-3xl">Play History</h1>
            </div>
            {!token ? (
              <div className="surface rounded-[1.5rem] px-6 py-14 text-center text-ink-400">
                Sign in to view your listening history
              </div>
            ) : history.length === 0 ? (
              <div className="surface rounded-[1.5rem] px-6 py-14 text-center text-ink-400">
                No play history yet. Start streaming!
              </div>
            ) : (
              <>
                <div className="space-y-2 sm:hidden">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="surface flex items-start justify-between gap-3 rounded-xl px-3 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-mist">{h.track_title}</p>
                        <p className="mt-0.5 truncate text-xs text-ink-400">{h.track_artist}</p>
                        <p className="mt-1 font-mono text-[10px] text-ink-500">
                          {new Date(h.played_at).toLocaleString()}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-lg border border-white/10 bg-ink-900 px-2 py-0.5 text-[10px] font-bold uppercase text-ink-300">
                        {h.source}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="surface hidden overflow-hidden rounded-2xl sm:block">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[540px] text-sm text-ink-300">
                      <thead className="border-b border-white/[0.06] bg-ink-950/60 text-left text-[11px] uppercase tracking-[0.14em] text-ink-500">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Track</th>
                          <th className="px-4 py-3 font-semibold">Artist</th>
                          <th className="px-4 py-3 font-semibold">Source</th>
                          <th className="px-4 py-3 text-right font-semibold">Played</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.04]">
                        {history.map((h) => (
                          <tr key={h.id} className="transition hover:bg-white/[0.03]">
                            <td className="px-4 py-3 font-semibold text-mist">{h.track_title}</td>
                            <td className="px-4 py-3 text-ink-400">{h.track_artist}</td>
                            <td className="px-4 py-3">
                              <span className="rounded-lg border border-white/10 bg-ink-900 px-2 py-0.5 text-[10px] font-bold uppercase">
                                {h.source}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-mono text-xs text-ink-500">
                              {new Date(h.played_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'admin' && user?.role === 'admin' && <AdminPanel token={token} />}
      </main>
      </div>

      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        queueCount={queueState.tracks.length}
        canSkipPrev={canSkipPrev}
        canSkipNext={canSkipNext || autoPlay}
        autoPlay={autoPlay}
        onAutoPlayChange={setAutoPlay}
        onPlayPause={() => setIsPlaying(!isPlaying)}
        onSkipPrev={handleSkipPrev}
        onSkipNext={handleSkipNext}
        onTrackEnded={handleTrackEnded}
        onOpenQueue={() => setShowQueue(true)}
        onDownloadTrack={handleDownload}
        offlineTrackIds={offlineTrackIds}
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
        offlineTracks={offlineTracks}
        offlineTrackIds={offlineTrackIds}
      />

      <QueueDrawer
        isOpen={showQueue}
        onClose={() => setShowQueue(false)}
        queue={queueState.tracks}
        currentIndex={queueState.index}
        onPlayAt={playAtQueueIndex}
        onRemoveAt={removeFromQueue}
        onClear={clearQueue}
      />

      <PlaylistPicker
        isOpen={!!playlistTrack}
        track={playlistTrack}
        playlists={playlists}
        onClose={() => setPlaylistTrack(null)}
        onSelect={async (playlistId) => {
          if (!playlistTrack) return;
          await addTrackToPlaylist(playlistId, playlistTrack);
        }}
        onCreate={async (name) => {
          if (!playlistTrack) return;
          await createPlaylistAndAdd(name, playlistTrack);
        }}
      />
    </div>
  );
}
