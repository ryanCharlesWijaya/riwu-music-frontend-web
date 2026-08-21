'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search, History, ListMusic, Download } from 'lucide-react';
import Navbar from './components/Navbar';
import PlayerBar from './components/PlayerBar';
import AdminPanel from './components/AdminPanel';
import AuthModal from './components/AuthModal';
import DownloadDrawer from './components/DownloadDrawer';
import PlaylistPicker from './components/PlaylistPicker';
import PlaylistDetail, { PlaylistRow } from './components/PlaylistDetail';
import SearchResults from './components/SearchResults';
import DownloadsLibrary from './components/DownloadsLibrary';
import QueueDrawer from './components/QueueDrawer';
import Settings, { ThemeMode } from './components/Settings';
import PasswordModal from './components/PasswordModal';
import {
  HistorySkeleton,
  LibraryPageSkeleton,
  PlaylistGridSkeleton,
} from './components/Skeleton';
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
  listAllCachedPlaylistTrackIds,
} from './lib/localCache';

type AppTab = 'player' | 'admin' | 'playlists' | 'history' | 'downloads' | 'settings';

type QueueState = {
  tracks: MediaItem[];
  index: number;
};

const PLAYLIST_DL_IDS_KEY = 'riwu_playlist_dl_ids';
const THEME_KEY = 'riwu_theme';
const AUTO_LOCAL_PLAYLIST_KEY = 'riwu_auto_local_playlist';

function readPlaylistDownloadIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(PLAYLIST_DL_IDS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : []);
  } catch {
    return new Set();
  }
}

function writePlaylistDownloadIds(ids: Set<string>) {
  localStorage.setItem(PLAYLIST_DL_IDS_KEY, JSON.stringify(Array.from(ids)));
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('player');
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [autoLocalPlaylist, setAutoLocalPlaylist] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [playlistDownloadIds, setPlaylistDownloadIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [queueState, setQueueState] = useState<QueueState>({ tracks: [], index: 0 });
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [playlistRows, setPlaylistRows] = useState<PlaylistRow[]>([]);
  const [loadingPlaylistTracks, setLoadingPlaylistTracks] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [tabReady, setTabReady] = useState(true);
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
  const tabTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentTrack = queueState.tracks[queueState.index] ?? null;
  const canSkipPrev = queueState.index > 0;
  const canSkipNext = queueState.index < queueState.tracks.length - 1;
  const playlistTracks = useMemo(() => playlistRows.map((r) => r.track), [playlistRows]);

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
    return () => {
      if (tabTimerRef.current) clearTimeout(tabTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY);
    const nextTheme: ThemeMode = savedTheme === 'light' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);

    const savedAuto = localStorage.getItem(AUTO_LOCAL_PLAYLIST_KEY);
    if (savedAuto === '0') setAutoLocalPlaylist(false);
    if (savedAuto === '1') setAutoLocalPlaylist(true);

    setPlaylistDownloadIds(readPlaylistDownloadIds());
  }, []);

  const applyTheme = useCallback((next: ThemeMode) => {
    setTheme(next);
    localStorage.setItem(THEME_KEY, next);
    document.documentElement.setAttribute('data-theme', next);
  }, []);

  const applyAutoLocalPlaylist = useCallback((enabled: boolean) => {
    setAutoLocalPlaylist(enabled);
    localStorage.setItem(AUTO_LOCAL_PLAYLIST_KEY, enabled ? '1' : '0');
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
    setPlaylistRows([]);
    setPlaylists([]);
    setDownloads([]);
  };

  const changeTab = (tab: AppTab) => {
    setTabReady(false);
    setActiveTab(tab);
    if (tab !== 'playlists') {
      setSelectedPlaylistId(null);
      setPlaylistRows([]);
    } else {
      setSelectedPlaylistId(null);
      setPlaylistRows([]);
    }
    if (tabTimerRef.current) clearTimeout(tabTimerRef.current);
    tabTimerRef.current = setTimeout(() => setTabReady(true), 200);
  };

  const loadPlaylistTracks = useCallback(
    async (playlistId: string) => {
      if (!token) {
        const cached = readCachedPlaylistTracks(playlistId);
        setPlaylistRows(cached.map((track) => ({ track })));
        return;
      }
      setLoadingPlaylistTracks(true);
      try {
        const data = await fetchWithAuth(
          `/playlists/detail?id=${encodeURIComponent(playlistId)}`,
          token
        );
        const items = Array.isArray(data?.items) ? data.items : [];
        const rows: PlaylistRow[] = items
          .map((item: { track?: MediaItem; added_at?: string }) =>
            item.track
              ? {
                  track: item.track,
                  addedAt: item.added_at,
                }
              : null,
          )
          .filter((row: PlaylistRow | null): row is PlaylistRow => !!row);
        setPlaylistRows(rows);
        cachePlaylistTracks(
          playlistId,
          rows.map((r) => r.track),
        );
        void prefetchTracks(rows.map((r) => r.track.id));
      } catch (err) {
        console.error('Failed to load playlist tracks:', err);
        const cached = readCachedPlaylistTracks(playlistId);
        setPlaylistRows(cached.map((track) => ({ track })));
      } finally {
        setLoadingPlaylistTracks(false);
      }
    },
    [token]
  );

  const openPlaylist = useCallback(
    (playlistId: string) => {
      setTabReady(false);
      setActiveTab('playlists');
      setSelectedPlaylistId(playlistId);
      void loadPlaylistTracks(playlistId);
      if (tabTimerRef.current) clearTimeout(tabTimerRef.current);
      tabTimerRef.current = setTimeout(() => setTabReady(true), 160);
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
    setLoadingPlaylists(true);
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
    } finally {
      setLoadingPlaylists(false);
    }
  }, [token]);

  const loadHistory = useCallback(async (): Promise<PlayHistory[]> => {
    if (!token) return [];
    setLoadingHistory(true);
    try {
      const data = await fetchWithAuth('/history', token);
      const items = Array.isArray(data) ? (data as PlayHistory[]) : [];
      setHistory(items);
      // Precache ~10s heads for the latest listened YouTube tracks.
      void prefetchTracks(
        items.slice(0, 10).map((h) => h.track_id),
        { priority: true },
      );
      return items;
    } catch (err) {
      console.error('Failed to load history:', err);
      return [];
    } finally {
      setLoadingHistory(false);
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
      // Precache stream heads for newest completed downloads (online replay path).
      const latest = list
        .filter((t) => t.status === 'completed' && t.track_id.startsWith('yt_'))
        .slice(0, 10)
        .map((t) => t.track_id);
      void prefetchTracks(latest, { priority: true });
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

        setPlaylistDownloadIds((prev) => {
          const next = new Set(prev);
          if (playlistId) {
            for (const track of readCachedPlaylistTracks(playlistId)) next.add(track.id);
            if (selectedPlaylistId === playlistId) {
              for (const track of playlistTracks) next.add(track.id);
            }
          } else {
            for (const id of listAllCachedPlaylistTrackIds()) next.add(id);
            for (const pl of playlists) {
              for (const track of readCachedPlaylistTracks(pl.id)) next.add(track.id);
            }
          }
          writePlaylistDownloadIds(next);
          return next;
        });

        await loadDownloads();
      } catch (err) {
        console.error('Failed to queue playlist downloads:', err);
      }
    },
    [token, loadDownloads, playlists, selectedPlaylistId, playlistTracks]
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
  // Playlist tracks only auto-cache locally when the settings toggle is on.
  useEffect(() => {
    if (!token) return;
    for (const task of downloads) {
      if (task.status !== 'completed') continue;
      if (offlineTrackIds.has(task.track_id)) continue;
      if (cachingRef.current.has(task.track_id)) continue;
      const fromPlaylist =
        playlistDownloadIds.has(task.track_id) ||
        listAllCachedPlaylistTrackIds().includes(task.track_id);
      if (fromPlaylist && !autoLocalPlaylist) continue;
      cachingRef.current.add(task.track_id);
      void cacheDownloadForOffline(task, token)
        .then(() => refreshOfflineIds())
        .catch(console.error)
        .finally(() => cachingRef.current.delete(task.track_id));
    }
  }, [downloads, token, offlineTrackIds, refreshOfflineIds, playlistDownloadIds, autoLocalPlaylist]);

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
    }
  }, [currentTrack?.id, isPlaying, recordHistory]);

  // Resolve + buffer ~10s head for the next queued songs while this one plays.
  useEffect(() => {
    const upcoming = queueState.tracks
      .slice(queueState.index + 1, queueState.index + 3)
      .map((t) => t.id)
      .filter((id) => id.startsWith('yt_'));
    if (upcoming.length === 0) return;
    void prefetchTracks(upcoming, { priority: true });
  }, [queueState.index, queueState.tracks]);

  const nextTrackIds = useMemo(
    () =>
      queueState.tracks
        .slice(queueState.index + 1, queueState.index + 3)
        .map((t) => t.id)
        .filter((id) => id.startsWith('yt_')),
    [queueState.index, queueState.tracks],
  );

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

  const reorderQueue = (fromIndex: number, toIndex: number) => {
    setQueueState((prev) => {
      if (
        fromIndex === toIndex ||
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.tracks.length ||
        toIndex >= prev.tracks.length
      ) {
        return prev;
      }

      const tracks = [...prev.tracks];
      const [moved] = tracks.splice(fromIndex, 1);
      tracks.splice(toIndex, 0, moved);

      let nextIndex = prev.index;
      if (fromIndex === prev.index) {
        nextIndex = toIndex;
      } else if (fromIndex < prev.index && toIndex >= prev.index) {
        nextIndex = prev.index - 1;
      } else if (fromIndex > prev.index && toIndex <= prev.index) {
        nextIndex = prev.index + 1;
      }

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

        <main className="w-full px-3 pb-player pt-[7.25rem] sm:px-7 lg:px-8 lg:pt-[7.5rem]">
        {!tabReady ? (
          activeTab === 'history' ? (
            <div className="animate-rise-in space-y-6">
              <div className="flex items-center gap-3">
                <History className="h-7 w-7 text-ember" />
                <h1 className="font-display text-2xl font-bold text-mist sm:text-3xl">Play History</h1>
              </div>
              <HistorySkeleton />
            </div>
          ) : activeTab === 'playlists' && !selectedPlaylistId ? (
            <div className="animate-rise-in space-y-6">
              <div className="flex items-center gap-3">
                <ListMusic className="h-7 w-7 shrink-0 text-signal" />
                <h1 className="font-display text-2xl font-bold text-mist sm:text-3xl">Your Playlists</h1>
              </div>
              <PlaylistGridSkeleton />
            </div>
          ) : (
            <LibraryPageSkeleton withBack={activeTab === 'playlists'} />
          )
        ) : (
          <>
        {activeTab === 'player' && (
          <SearchResults
            query={searchQuery}
            results={searchResults}
            isSearching={isSearching}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            downloadsByTrack={downloadsByTrack}
            offlineTrackIds={offlineTrackIds}
            onPlayAll={playQueue}
            onTogglePlay={() => setIsPlaying((v) => !v)}
            onPlayTrack={handlePlay}
            onDownloadTrack={handleDownload}
            onAddToQueue={handleAddToQueue}
            onAddToPlaylist={handleAddToPlaylist}
          />
        )}

        {activeTab === 'downloads' && (
          <DownloadsLibrary
            tracks={downloadedLibrary}
            pendingCount={pendingCount}
            currentTrackId={currentTrack?.id}
            isPlaying={isPlaying}
            downloadsByTrack={downloadsByTrack}
            offlineTrackIds={offlineTrackIds}
            onPlayAll={playQueue}
            onTogglePlay={() => setIsPlaying((v) => !v)}
            onPlayTrack={handlePlay}
            onDownloadTrack={handleDownload}
            onAddToQueue={handleAddToQueue}
            onAddToPlaylist={handleAddToPlaylist}
            onOpenQueue={() => setShowDownloads(true)}
          />
        )}

        {activeTab === 'playlists' && (
          <div className="animate-rise-in">
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
            ) : selectedPlaylist ? (
              <PlaylistDetail
                playlist={selectedPlaylist}
                rows={playlistRows}
                user={user}
                loading={loadingPlaylistTracks}
                currentTrackId={currentTrack?.id}
                isPlaying={isPlaying}
                downloadsByTrack={downloadsByTrack}
                offlineTrackIds={offlineTrackIds}
                onBack={() => changeTab('playlists')}
                onPlayAll={playQueue}
                onTogglePlay={() => setIsPlaying((v) => !v)}
                onPlayTrack={(track) => {
                  const idx = playlistTracks.findIndex((t) => t.id === track.id);
                  if (idx >= 0) playQueue(playlistTracks, idx);
                  else handlePlay(track);
                }}
                onDownloadAll={() => void queuePlaylistDownloads(selectedPlaylistId)}
                onDownloadTrack={handleDownload}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <ListMusic className="h-7 w-7 shrink-0 text-signal" />
                    <h1 className="truncate font-display text-2xl font-bold text-mist sm:text-3xl">
                      Your Playlists
                    </h1>
                  </div>
                  {token && playlists.length > 0 && (
                    <button
                      type="button"
                      onClick={() => void queuePlaylistDownloads(null)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-signal/35 bg-signal/10 px-4 py-2 text-sm font-semibold text-signal transition hover:bg-signal/20"
                    >
                      <Download className="h-4 w-4" />
                      Download all playlists
                    </button>
                  )}
                </div>
                {loadingPlaylists && playlists.length === 0 ? (
                  <PlaylistGridSkeleton />
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
                        <div className="mb-4 flex h-28 w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-signal/25 via-ink-800 to-ember/20">
                          {pl.cover_url ? (
                            <img src={pl.cover_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ListMusic className="h-10 w-10 text-signal/80" />
                          )}
                        </div>
                        <h3 className="font-display text-lg font-bold text-mist">{pl.name}</h3>
                        <p className="mt-1 text-xs text-ink-400">{pl.description || 'No description'}</p>
                        <p className="mt-4 font-mono text-sm text-signal">{pl.item_count} tracks</p>
                      </button>
                    ))}
                  </div>
                )}
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
            ) : loadingHistory && history.length === 0 ? (
              <HistorySkeleton rows={8} />
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

        {activeTab === 'settings' && (
          <Settings
            user={user}
            token={token}
            theme={theme}
            autoLocalPlaylist={autoLocalPlaylist}
            onThemeChange={applyTheme}
            onAutoLocalPlaylistChange={applyAutoLocalPlaylist}
            onUserUpdated={(nextUser) => {
              setUser(nextUser);
              localStorage.setItem('riwu_user', JSON.stringify(nextUser));
            }}
            onOpenPasswordModal={() => setShowPasswordModal(true)}
            onOpenAuth={() => setShowAuth(true)}
            onLogout={handleLogout}
          />
        )}
          </>
        )}
      </main>
      </div>

      <PlayerBar
        currentTrack={currentTrack}
        isPlaying={isPlaying}
        queueCount={queueState.tracks.length}
        nextTrackIds={nextTrackIds}
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

      <PasswordModal
        isOpen={showPasswordModal}
        token={token || ''}
        onClose={() => setShowPasswordModal(false)}
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
        onReorder={reorderQueue}
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
