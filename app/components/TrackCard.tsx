'use client';

import React from 'react';
import {
  Play,
  Pause,
  Download,
  Plus,
  ListPlus,
  HardDrive,
  Layers,
  Clock,
  Video,
  Check,
  Loader2,
} from 'lucide-react';
import { MediaItem, DownloadTask, prefetchTracks } from '../lib/api';

interface TrackCardProps {
  track: MediaItem;
  isPlaying: boolean;
  downloadTask?: DownloadTask | null;
  isOfflineReady?: boolean;
  onPlay: (track: MediaItem) => void;
  onDownload: (track: MediaItem) => void;
  onAddToPlaylist: (track: MediaItem) => void;
  onAddToQueue: (track: MediaItem) => void;
}

export default function TrackCard({
  track,
  isPlaying,
  downloadTask,
  isOfflineReady,
  onPlay,
  onDownload,
  onAddToPlaylist,
  onAddToQueue,
}: TrackCardProps) {
  const status = downloadTask?.status;
  const isDownloaded = status === 'completed' || !!isOfflineReady;
  const isBusy = status === 'pending' || status === 'downloading' || status === 'converting';

  const sourceLabel = (source: string) => {
    switch (source) {
      case 'youtube':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ember">
            <Video className="h-3 w-3" /> YT
          </span>
        );
      case 'gdrive':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-300">
            <HardDrive className="h-3 w-3" /> Drive
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-signal">
            <Layers className="h-3 w-3" /> Local
          </span>
        );
    }
  };

  const formatDuration = (secs: number) => {
    if (!secs) return '—';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${
        isPlaying
          ? 'border-signal/50 bg-signal/5 shadow-lift'
          : 'border-white/[0.06] bg-ink-900/50 hover:border-white/15 hover:bg-ink-800/60'
      }`}
      onMouseEnter={() => track.id.startsWith('yt_') && void prefetchTracks([track.id])}
    >
      {/* Mobile: horizontal row */}
      <div className="flex items-center gap-3 p-2.5 sm:hidden">
        <button
          type="button"
          onClick={() => onPlay(track)}
          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-white/10"
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          <img
            src={track.thumbnail_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80'}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-ink-950/40">
            {isPlaying ? (
              <Pause className="h-5 w-5 fill-current text-signal" />
            ) : (
              <Play className="ml-0.5 h-5 w-5 fill-current text-mist" />
            )}
          </div>
        </button>

        <button type="button" onClick={() => onPlay(track)} className="min-w-0 flex-1 text-left">
          <h3 className="truncate font-display text-sm font-bold text-mist">{track.title}</h3>
          <p className="mt-0.5 truncate text-xs text-ink-400">{track.artist}</p>
          <div className="mt-1 flex items-center gap-2">
            {sourceLabel(track.source)}
            {isDownloaded && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold uppercase text-signal">
                <Check className="h-3 w-3" /> Saved
              </span>
            )}
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => onAddToQueue(track)}
            className="rounded-lg p-2 text-ink-400 active:bg-white/10"
            title="Add to queue"
          >
            <ListPlus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onAddToPlaylist(track)}
            className="rounded-lg p-2 text-ink-400 active:bg-white/10"
            title="Add to playlist"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDownload(track)}
            disabled={isBusy}
            className={`rounded-lg p-2 ${
              isDownloaded ? 'text-signal' : isBusy ? 'text-ink-500' : 'text-ink-400'
            }`}
            title={isDownloaded ? 'Available offline' : 'Cache for offline'}
          >
            {isBusy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isDownloaded ? (
              <Check className="h-4 w-4" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Desktop / tablet: card */}
      <div className="hidden flex-col sm:flex">
        <div className="relative aspect-[16/10] overflow-hidden bg-ink-950">
          <img
            src={track.thumbnail_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80'}
            alt=""
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent" />

          <div className="absolute left-3 top-3">{sourceLabel(track.source)}</div>
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-lg bg-ink-950/70 px-2 py-1 font-mono text-[10px] text-ink-200 backdrop-blur">
            <Clock className="h-3 w-3" />
            {formatDuration(track.duration)}
          </div>

          {isDownloaded && (
            <div className="absolute bottom-3 left-3 inline-flex items-center gap-1 rounded-lg bg-signal px-2 py-1 text-[10px] font-bold uppercase text-ink-950">
              <Check className="h-3 w-3" /> Saved
            </div>
          )}

          <button
            type="button"
            onClick={() => onPlay(track)}
            className="absolute bottom-3 right-3 flex h-12 w-12 items-center justify-center rounded-full bg-signal text-ink-950 opacity-100 shadow-lift transition-transform duration-200 hover:scale-105 sm:opacity-0 sm:group-hover:opacity-100"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="h-5 w-5 fill-current" /> : <Play className="ml-0.5 h-5 w-5 fill-current" />}
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3 p-4">
          <div className="min-w-0">
            <h3 className="truncate font-display text-base font-bold text-mist transition-colors group-hover:text-signal">
              {track.title}
            </h3>
            <p className="mt-0.5 truncate text-sm text-ink-400">{track.artist}</p>
          </div>

          <div className="mt-auto flex items-center gap-1.5 border-t border-white/[0.05] pt-3">
            <button
              type="button"
              onClick={() => onPlay(track)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                isPlaying ? 'bg-signal text-ink-950' : 'bg-white/[0.04] text-mist hover:bg-white/[0.08]'
              }`}
            >
              {isPlaying ? <Pause className="h-3.5 w-3.5 fill-current" /> : <Play className="h-3.5 w-3.5 fill-current" />}
              {isPlaying ? 'Playing' : 'Play'}
            </button>

            <button
              type="button"
              onClick={() => onAddToQueue(track)}
              className="rounded-xl bg-white/[0.04] p-2 text-ink-300 transition hover:bg-white/[0.08] hover:text-signal"
              title="Add to queue"
            >
              <ListPlus className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => onAddToPlaylist(track)}
              className="rounded-xl bg-white/[0.04] p-2 text-ink-300 transition hover:bg-white/[0.08] hover:text-mist"
              title="Add to playlist"
            >
              <Plus className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => onDownload(track)}
              disabled={isBusy}
              className={`relative rounded-xl border p-2 transition ${
                isDownloaded
                  ? 'border-signal/40 bg-signal/10 text-signal'
                  : isBusy
                    ? 'cursor-wait border-white/10 bg-white/[0.03] text-ink-400 opacity-70'
                    : 'border-white/10 bg-white/[0.04] text-ink-300 hover:border-ember/40 hover:text-ember'
              }`}
              title={
                isDownloaded
                  ? 'Available offline'
                  : isBusy
                    ? `Downloading… ${downloadTask?.progress ?? 0}%`
                    : 'Cache for offline'
              }
            >
              {isBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isDownloaded ? (
                <Check className="h-4 w-4" />
              ) : (
                <Download className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
