'use client';

import React from 'react';
import {
  Clock,
  Download,
  ListPlus,
  Pause,
  Play,
  Plus,
  Video,
  HardDrive,
  Layers,
} from 'lucide-react';
import { DownloadTask, MediaItem, prefetchTracks } from '../lib/api';

export type TrackTableRow = {
  track: MediaItem;
  addedAt?: string;
};

interface TrackTableProps {
  rows: TrackTableRow[];
  currentTrackId?: string | null;
  isPlaying: boolean;
  downloadsByTrack?: Record<string, DownloadTask>;
  offlineTrackIds?: Set<string>;
  /** Show album column (default true). */
  showAlbum?: boolean;
  /** Show date-added column. */
  showAdded?: boolean;
  /** Show source column (youtube / gdrive / local). */
  showSource?: boolean;
  emptyMessage?: string;
  onPlayAt: (index: number) => void;
  onPlayTrack: (track: MediaItem) => void;
  onDownloadTrack?: (track: MediaItem) => void;
  onAddToQueue?: (track: MediaItem) => void;
  onAddToPlaylist?: (track: MediaItem) => void;
}

export function formatDuration(secs: number) {
  if (!secs || secs <= 0) return '—';
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function formatAdded(iso?: string) {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';
  const now = Date.now();
  const diffDays = Math.floor((now - date.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 14) return `${diffDays} days ago`;
  if (diffDays < 45) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function sourceLabel(source: string) {
  switch (source) {
    case 'youtube':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-ember">
          <Video className="h-3 w-3" /> YouTube
        </span>
      );
    case 'gdrive':
      return (
        <span className="inline-flex items-center gap-1 text-xs text-teal-300">
          <HardDrive className="h-3 w-3" /> Drive
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 text-xs text-signal">
          <Layers className="h-3 w-3" /> Local
        </span>
      );
  }
}

export default function TrackTable({
  rows,
  currentTrackId,
  isPlaying,
  downloadsByTrack = {},
  offlineTrackIds = new Set(),
  showAlbum = true,
  showAdded = false,
  showSource = false,
  emptyMessage = 'No tracks',
  onPlayAt,
  onPlayTrack,
  onDownloadTrack,
  onAddToQueue,
  onAddToPlaylist,
}: TrackTableProps) {
  if (rows.length === 0) {
    return <div className="px-2 py-16 text-center text-ink-400">{emptyMessage}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-left text-sm">
        <thead className="sticky top-0 z-10 border-b border-white/[0.08] bg-ink-950/90 text-[11px] uppercase tracking-[0.12em] text-ink-500 backdrop-blur">
          <tr>
            <th className="w-12 px-2 py-3 font-medium">#</th>
            <th className="px-2 py-3 font-medium">Title</th>
            {showAlbum && <th className="hidden px-2 py-3 font-medium md:table-cell">Album</th>}
            {showSource && <th className="hidden px-2 py-3 font-medium sm:table-cell">Source</th>}
            {showAdded && <th className="hidden px-2 py-3 font-medium lg:table-cell">Date added</th>}
            <th className="w-16 px-2 py-3 text-right font-medium">
              <Clock className="ml-auto h-3.5 w-3.5" />
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => {
            const track = row.track;
            const active = currentTrackId === track.id;
            const offline =
              offlineTrackIds.has(track.id) || downloadsByTrack[track.id]?.status === 'completed';
            return (
              <tr
                key={`${track.id}-${index}`}
                className={`group border-b border-white/[0.03] transition hover:bg-white/[0.04] ${
                  active ? 'bg-signal/5' : ''
                }`}
                onMouseEnter={() =>
                  track.id.startsWith('yt_') && void prefetchTracks([track.id], { priority: true })
                }
                onDoubleClick={() => onPlayAt(index)}
              >
                <td className="px-2 py-2.5 align-middle">
                  <button
                    type="button"
                    onClick={() => onPlayTrack(track)}
                    className="flex h-8 w-8 items-center justify-center text-ink-400 transition hover:text-mist"
                    title={active && isPlaying ? 'Pause' : 'Play'}
                  >
                    {active && isPlaying ? (
                      <Pause className="h-3.5 w-3.5 fill-current text-signal" />
                    ) : (
                      <>
                        <span className="font-mono text-xs group-hover:hidden">{index + 1}</span>
                        <Play className="ml-0.5 hidden h-3.5 w-3.5 fill-current group-hover:block" />
                      </>
                    )}
                  </button>
                </td>
                <td className="px-2 py-2.5 align-middle">
                  <div className="flex min-w-0 items-center gap-3">
                    <img
                      src={
                        track.thumbnail_url ||
                        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200&q=80'
                      }
                      alt=""
                      className="h-10 w-10 shrink-0 rounded object-cover"
                    />
                    <div className="min-w-0">
                      <p className={`truncate font-semibold ${active ? 'text-signal' : 'text-mist'}`}>
                        {track.title}
                      </p>
                      <p className="truncate text-xs text-ink-400">{track.artist}</p>
                    </div>
                  </div>
                </td>
                {showAlbum && (
                  <td className="hidden px-2 py-2.5 align-middle text-ink-400 md:table-cell">
                    <span className="line-clamp-1">{track.album || '—'}</span>
                  </td>
                )}
                {showSource && (
                  <td className="hidden px-2 py-2.5 align-middle sm:table-cell">
                    {sourceLabel(track.source)}
                  </td>
                )}
                {showAdded && (
                  <td className="hidden px-2 py-2.5 align-middle text-ink-400 lg:table-cell">
                    {formatAdded(row.addedAt)}
                  </td>
                )}
                <td className="px-2 py-2.5 align-middle">
                  <div className="flex items-center justify-end gap-1">
                    {onAddToQueue && (
                      <button
                        type="button"
                        onClick={() => onAddToQueue(track)}
                        className="rounded p-1.5 text-ink-400 opacity-0 transition hover:text-signal group-hover:opacity-100"
                        title="Add to queue"
                      >
                        <ListPlus className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {onAddToPlaylist && (
                      <button
                        type="button"
                        onClick={() => onAddToPlaylist(track)}
                        className="rounded p-1.5 text-ink-400 opacity-0 transition hover:text-mist group-hover:opacity-100"
                        title="Add to playlist"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    )}
                    {onDownloadTrack && (
                      <button
                        type="button"
                        onClick={() => onDownloadTrack(track)}
                        className={`rounded p-1.5 transition ${
                          offline
                            ? 'text-signal opacity-100'
                            : 'text-ink-400 opacity-0 hover:text-mist group-hover:opacity-100'
                        }`}
                        title={offline ? 'Saved offline' : 'Download'}
                      >
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <span className="min-w-[2.5rem] text-right font-mono text-xs text-ink-400">
                      {formatDuration(track.duration)}
                    </span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
