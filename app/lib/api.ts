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
