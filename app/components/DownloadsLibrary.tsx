'use client';

import React from 'react';
import { Download, Pause, Play, Shuffle } from 'lucide-react';
import { DownloadTask, MediaItem } from '../lib/api';
import TrackTable from './TrackTable';

interface DownloadsLibraryProps {
  tracks: MediaItem[];
  pendingCount: number;
  currentTrackId?: string | null;
  isPlaying: boolean;
  downloadsByTrack: Record<string, DownloadTask>;
  offlineTrackIds: Set<string>;
  onPlayAll: (tracks: MediaItem[], startIndex?: number) => void;
  onTogglePlay: () => void;
  onPlayTrack: (track: MediaItem) => void;
  onDownloadTrack: (track: MediaItem) => void;
  onAddToQueue: (track: MediaItem) => void;
  onAddToPlaylist: (track: MediaItem) => void;
  onOpenQueue: () => void;
}

export default function DownloadsLibrary({
  tracks,
  pendingCount,
  currentTrackId,
  isPlaying,
  downloadsByTrack,
  offlineTrackIds,
  onPlayAll,
  onTogglePlay,
  onPlayTrack,
  onDownloadTrack,
  onAddToQueue,
  onAddToPlaylist,
  onOpenQueue,
}: DownloadsLibraryProps) {
  const cover = tracks.find((t) => t.thumbnail_url)?.thumbnail_url || '';
  const playingInLibrary = tracks.some((t) => t.id === currentTrackId) && isPlaying;

  if (tracks.length === 0) {
    return (
      <div className="animate-rise-in space-y-4">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onOpenQueue}
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
        <div className="surface flex flex-col items-center justify-center rounded-[1.25rem] px-5 py-12 text-center sm:rounded-[1.5rem] sm:px-6 sm:py-16">
          <Download className="mb-4 h-10 w-10 text-ink-600 sm:h-12 sm:w-12" />
          <p className="font-sans text-base font-semibold text-ink-300 sm:text-lg">No downloads yet</p>
          <p className="mt-2 max-w-sm text-xs text-ink-500 sm:text-sm">
            Download tracks from search or playlists — they will appear in this library.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise-in">
      <section className="relative overflow-hidden px-4 pb-6 pt-2 sm:px-5 sm:pb-8 sm:pt-4 lg:px-6">
        <div
          className="pointer-events-none absolute inset-0 -mx-3 sm:-mx-6 lg:-mx-8"
          style={{
            background: cover
              ? `linear-gradient(180deg, rgba(11,13,16,0.4) 0%, rgba(11,13,16,0.94) 78%, var(--bg) 100%),
                 linear-gradient(135deg, rgba(56,189,248,0.32), rgba(255,92,58,0.14) 55%, transparent),
                 url(${cover}) center/cover`
              : `linear-gradient(135deg, rgba(56,189,248,0.22) 0%, rgba(15,20,26,0.95) 50%, var(--bg) 100%)`,
          }}
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-7">
          <div className="mx-auto flex h-40 w-40 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-signal/70 via-ink-700 to-ink-900 shadow-[0_20px_50px_rgba(0,0,0,0.55)] sm:mx-0 sm:h-48 sm:w-48 lg:h-52 lg:w-52">
            {cover ? (
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <Download className="h-14 w-14 text-ink-950/70" strokeWidth={1.6} />
            )}
          </div>

          <div className="min-w-0 flex-1 pb-1 text-center sm:text-left">
            <p className="font-sans text-xs font-semibold uppercase tracking-wide text-mist">Library</p>
            <h1 className="mt-1 font-sans text-3xl font-extrabold leading-none tracking-tight text-mist sm:text-5xl lg:text-6xl">
              Downloads
            </h1>
            <p className="mt-3 font-sans text-sm text-ink-300">
              {tracks.length} {tracks.length === 1 ? 'song' : 'songs'} ready offline
            </p>
          </div>
        </div>
      </section>

      <div className="relative flex flex-wrap items-center gap-3 border-b border-white/[0.06] pb-4 pt-2">
        <button
          type="button"
          onClick={() => {
            if (playingInLibrary) {
              onTogglePlay();
              return;
            }
            onPlayAll(tracks, 0);
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-signal text-ink-950 shadow-lift transition hover:scale-105"
          title={playingInLibrary ? 'Pause' : 'Play all'}
        >
          {playingInLibrary ? (
            <Pause className="h-6 w-6 fill-current" />
          ) : (
            <Play className="ml-0.5 h-6 w-6 fill-current" />
          )}
        </button>
        <button
          type="button"
          onClick={() => {
            const shuffled = [...tracks].sort(() => Math.random() - 0.5);
            onPlayAll(shuffled, 0);
          }}
          className="rounded-full p-2 text-ink-400 transition hover:text-mist"
          title="Shuffle"
        >
          <Shuffle className="h-6 w-6" />
        </button>
        <button
          type="button"
          onClick={onOpenQueue}
          className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-ink-300 transition hover:border-signal/35 hover:text-signal"
        >
          Download queue
          {pendingCount > 0 && (
            <span className="rounded-full bg-ember px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
              {pendingCount}
            </span>
          )}
        </button>
      </div>

      <div className="mt-2">
        <TrackTable
          rows={tracks.map((track) => ({ track, addedAt: track.created_at }))}
          currentTrackId={currentTrackId}
          isPlaying={isPlaying}
          downloadsByTrack={downloadsByTrack}
          offlineTrackIds={offlineTrackIds}
          showAlbum
          showSource
          showAdded
          emptyMessage="No downloads yet."
          onPlayAt={(index) => onPlayAll(tracks, index)}
          onPlayTrack={(track) => {
            const idx = tracks.findIndex((t) => t.id === track.id);
            if (idx >= 0 && currentTrackId === track.id) {
              onTogglePlay();
              return;
            }
            if (idx >= 0) onPlayAll(tracks, idx);
            else onPlayTrack(track);
          }}
          onDownloadTrack={onDownloadTrack}
          onAddToQueue={onAddToQueue}
          onAddToPlaylist={onAddToPlaylist}
        />
      </div>
    </div>
  );
}
