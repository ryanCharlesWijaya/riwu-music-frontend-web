import { DownloadTask, MediaItem, Playlist } from './api';

const PLAYLISTS_KEY = 'riwu_cache_playlists';
const PLAYLIST_TRACKS_KEY = 'riwu_cache_playlist_tracks';
const DOWNLOADS_KEY = 'riwu_cache_downloads';

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error('Failed to write local cache', key, err);
  }
}

export function cachePlaylists(playlists: Playlist[]) {
  writeJson(PLAYLISTS_KEY, playlists);
}

export function readCachedPlaylists(): Playlist[] {
  const data = readJson<Playlist[]>(PLAYLISTS_KEY, []);
  return Array.isArray(data) ? data : [];
}

export function cachePlaylistTracks(playlistId: string, tracks: MediaItem[]) {
  const all = readJson<Record<string, MediaItem[]>>(PLAYLIST_TRACKS_KEY, {});
  all[playlistId] = tracks;
  writeJson(PLAYLIST_TRACKS_KEY, all);
}

export function readCachedPlaylistTracks(playlistId: string): MediaItem[] {
  const all = readJson<Record<string, MediaItem[]>>(PLAYLIST_TRACKS_KEY, {});
  const tracks = all[playlistId];
  return Array.isArray(tracks) ? tracks : [];
}

export function listAllCachedPlaylistTrackIds(): string[] {
  const all = readJson<Record<string, MediaItem[]>>(PLAYLIST_TRACKS_KEY, {});
  const ids = new Set<string>();
  for (const tracks of Object.values(all)) {
    if (!Array.isArray(tracks)) continue;
    for (const track of tracks) {
      if (track?.id) ids.add(track.id);
    }
  }
  return Array.from(ids);
}

export function cacheDownloads(downloads: DownloadTask[]) {
  writeJson(DOWNLOADS_KEY, downloads);
}

export function readCachedDownloads(): DownloadTask[] {
  const data = readJson<DownloadTask[]>(DOWNLOADS_KEY, []);
  return Array.isArray(data) ? data : [];
}

export function clearUserLocalCache() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PLAYLISTS_KEY);
  localStorage.removeItem(PLAYLIST_TRACKS_KEY);
  localStorage.removeItem(DOWNLOADS_KEY);
}
