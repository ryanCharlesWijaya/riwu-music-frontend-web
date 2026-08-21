'use client';

import React from 'react';
import { Pause, Play, Search, Shuffle } from 'lucide-react';
import { DownloadTask, MediaItem } from '../lib/api';
import TrackTable from './TrackTable';

interface SearchResultsProps {
  query: string;
  results: MediaItem[];
  isSearching: boolean;
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
}

export default function SearchResults({
  query,
  results,
  isSearching,
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
}: SearchResultsProps) {
  const cover = results.find((t) => t.thumbnail_url)?.thumbnail_url || '';
  const playingInResults = results.some((t) => t.id === currentTrackId) && isPlaying;
  const title = query.trim() || 'Search results';

  if (!isSearching && results.length === 0) {
    return (
      <div className="surface flex flex-col items-center justify-center rounded-[1.25rem] px-5 py-12 text-center sm:rounded-[1.5rem] sm:px-6 sm:py-16">
        <Search className="mb-4 h-10 w-10 text-ink-600 sm:h-12 sm:w-12" />
        <p className="font-display text-base font-semibold text-ink-300 sm:text-lg">No results yet</p>
        <p className="mt-2 max-w-sm text-xs text-ink-500 sm:text-sm">
          Try “jazz”, “lofi”, or an artist name — results warm up in the background as they appear.
        </p>
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
              <Search className="h-14 w-14 text-ink-950/70" strokeWidth={1.6} />
            )}
          </div>

          <div className="min-w-0 flex-1 pb-1 text-center sm:text-left">
            <p className="font-sans text-xs font-semibold uppercase tracking-wide text-mist">Search</p>
            <h1 className="mt-1 font-sans text-3xl font-extrabold leading-none tracking-tight text-mist sm:text-5xl lg:text-6xl">
              {isSearching ? 'Searching…' : title}
            </h1>
            <p className="mt-3 font-sans text-sm text-ink-300">
              {isSearching
                ? 'Fetching tracks across media sources'
                : `${results.length} ${results.length === 1 ? 'song' : 'songs'}`}
            </p>
          </div>
        </div>
      </section>

      <div className="relative flex flex-wrap items-center gap-3 border-b border-white/[0.06] pb-4 pt-2">
        <button
          type="button"
          disabled={results.length === 0}
          onClick={() => {
            if (playingInResults) {
              onTogglePlay();
              return;
            }
            onPlayAll(results, 0);
          }}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-signal text-ink-950 shadow-lift transition hover:scale-105 disabled:opacity-40"
          title={playingInResults ? 'Pause' : 'Play all'}
        >
          {playingInResults ? (
            <Pause className="h-6 w-6 fill-current" />
          ) : (
            <Play className="ml-0.5 h-6 w-6 fill-current" />
          )}
        </button>
        <button
          type="button"
          disabled={results.length === 0}
          onClick={() => {
            const shuffled = [...results].sort(() => Math.random() - 0.5);
            onPlayAll(shuffled, 0);
          }}
          className="rounded-full p-2 text-ink-400 transition hover:text-mist disabled:opacity-40"
          title="Shuffle"
        >
          <Shuffle className="h-6 w-6" />
        </button>
      </div>

      <div className="mt-2">
        {isSearching && results.length === 0 ? (
          <div className="px-2 py-16 text-center text-ink-400">Searching…</div>
        ) : (
          <TrackTable
            rows={results.map((track) => ({ track }))}
            currentTrackId={currentTrackId}
            isPlaying={isPlaying}
            downloadsByTrack={downloadsByTrack}
            offlineTrackIds={offlineTrackIds}
            showAlbum
            showSource
            emptyMessage="No tracks found."
            onPlayAt={(index) => onPlayAll(results, index)}
            onPlayTrack={(track) => {
              const idx = results.findIndex((t) => t.id === track.id);
              if (idx >= 0 && currentTrackId === track.id) {
                onTogglePlay();
                return;
              }
              if (idx >= 0) onPlayAll(results, idx);
              else onPlayTrack(track);
            }}
            onDownloadTrack={onDownloadTrack}
            onAddToQueue={onAddToQueue}
            onAddToPlaylist={onAddToPlaylist}
          />
        )}
      </div>
    </div>
  );
}
