import { cacheOfflineTrack, hasOfflineTrack, updateOfflineTrackMeta } from './offlineStore';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
}

export interface MediaItem {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  bitrate: number;
  format: string;
  source: 'youtube' | 'gdrive' | 'local';
  source_url: string;
  thumbnail_url: string;
  file_size: number;
  created_at: string;
}

export interface ModuleState {
  module_id: string;
  name: string;
  description: string;
  is_enabled: boolean;
  updated_at: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description: string;
  cover_url: string;
  item_count: number;
  created_at: string;
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  track_id: string;
  position: number;
  track?: MediaItem;
  added_at: string;
}

export interface PlayHistory {
  id: string;
  user_id: string;
  track_id: string;
  track_title: string;
  track_artist: string;
  thumbnail_url: string;
  source: string;
  duration_played: number;
  played_at: string;
}

export interface DownloadTask {
  id: string;
  user_id: string;
  track_id: string;
  title: string;
  artist: string;
  source: string;
  source_url: string;
  status: 'pending' | 'downloading' | 'converting' | 'completed' | 'failed';
  format: string;
  progress: number;
  target_path: string;
  file_size: number;
  error_message?: string;
  created_at: string;
  completed_at?: string;
}

export interface SystemStats {
  total_users: number;
  active_modules: number;
  total_playlists: number;
  play_history_count: number;
  total_downloads: number;
  active_workers: number;
  pending_tasks: number;
}

export async function prefetchTracks(ids: string[]) {
  const trackIds = ids.filter((id) => id.startsWith('yt_')).slice(0, 8);
  if (trackIds.length === 0) return;
  try {
    await fetch(`${API_BASE}/media/prefetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: trackIds }),
    });
  } catch {
    // Prefetch is best-effort.
  }
}

export async function waitForStreamReady(trackId: string, timeoutMs = 6000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${API_BASE}/media/ready?id=${encodeURIComponent(trackId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.ready) return true;
      }
    } catch {
      // keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return false;
}

export async function fetchWithAuth(url: string, token: string | null, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(errText || `HTTP Error ${res.status}`);
  }

  return res.json();
}

/**
 * Quietly copy a completed VPS download into IndexedDB so the browser can
 * play it offline — no Save As dialog, no visible Downloads folder entry.
 */
export async function cacheDownloadForOffline(task: DownloadTask, token: string | null) {
  const realTitle = task.title && !task.title.toLowerCase().startsWith('youtube audio track');
  if (await hasOfflineTrack(task.track_id)) {
    if (realTitle) {
      await updateOfflineTrackMeta(task.track_id, {
        title: task.title,
        artist: task.artist || undefined,
      });
    }
    return;
  }

  const filename = task.target_path.split('/').pop() || `${task.track_id}.m4a`;
  const params = new URLSearchParams({ track_id: task.track_id });
  if (task.title) params.set('title', task.title);
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/downloads/file/${encodeURIComponent(filename)}?${params}`, {
    headers,
  });
  if (!res.ok) {
    throw new Error('Unable to cache song for offline playback');
  }
  const blob = await res.blob();
  await cacheOfflineTrack({
    trackId: task.track_id,
    title: task.title || task.track_id,
    artist: task.artist || '',
    blob,
    mimeType: blob.type || 'audio/mp4',
  });
}

export function latestDownloadByTrack(downloads: DownloadTask[]): Record<string, DownloadTask> {
  const map: Record<string, DownloadTask> = {};
  for (const task of downloads) {
    const existing = map[task.track_id];
    if (!existing) {
      map[task.track_id] = task;
      continue;
    }
    if (task.status === 'completed' && existing.status !== 'completed') {
      map[task.track_id] = task;
    }
  }
  return map;
}
