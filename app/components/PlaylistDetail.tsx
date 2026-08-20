'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Download,
  ListMusic,
  Pause,
  Play,
  Search,
  Shuffle,
} from 'lucide-react';
import { DownloadTask, MediaItem, Playlist, User } from '../lib/api';
import TrackTable, { TrackTableRow } from './TrackTable';

export type PlaylistRow = TrackTableRow;

interface PlaylistDetailProps {
  playlist: Playlist;
  rows: PlaylistRow[];
  user: User | null;
  loading?: boolean;
  currentTrackId?: string | null;
  isPlaying: boolean;
  downloadsByTrack: Record<string, DownloadTask>;
  offlineTrackIds: Set<string>;
  onBack: () => void;
  onPlayAll: (tracks: MediaItem[], startIndex?: number) => void;
  onTogglePlay: () => void;
  onPlayTrack: (track: MediaItem) => void;
  onDownloadAll: () => void;
  onDownloadTrack: (track: MediaItem) => void;
}

export default function PlaylistDetail({
  playlist,
  rows,
  user,
  loading,
  currentTrackId,
  isPlaying,
  downloadsByTrack,
  offlineTrackIds,
  onBack,
  onPlayAll,
  onTogglePlay,
  onPlayTrack,
  onDownloadAll,
  onDownloadTrack,
}: PlaylistDetailProps) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'custom' | 'title' | 'artist' | 'added'>('custom');

  const cover =
    playlist.cover_url ||
    rows.find((r) => r.track.thumbnail_url)?.track.thumbnail_url ||
    '';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = rows;
    if (q) {
      list = list.filter(
        (r) =>
          r.track.title.toLowerCase().includes(q) ||
          r.track.artist.toLowerCase().includes(q) ||
          (r.track.album || '').toLowerCase().includes(q),
      );
    }
    if (sort === 'title') {
      list = [...list].sort((a, b) => a.track.title.localeCompare(b.track.title));
    } else if (sort === 'artist') {
      list = [...list].sort((a, b) => a.track.artist.localeCompare(b.track.artist));
    } else if (sort === 'added') {
      list = [...list].sort((a, b) => {
        const ta = a.addedAt ? new Date(a.addedAt).getTime() : 0;
        const tb = b.addedAt ? new Date(b.addedAt).getTime() : 0;
        return tb - ta;
      });
    }
    return list;
  }, [rows, query, sort]);

  const tracks = filtered.map((r) => r.track);
  const playingInPlaylist = rows.some((r) => r.track.id === currentTrackId) && isPlaying;

  const handleShuffle = () => {
    const shuffled = [...rows.map((r) => r.track)].sort(() => Math.random() - 0.5);
    onPlayAll(shuffled, 0);
  };

  return (
    <div className="animate-rise-in">
      <section className="relative overflow-hidden px-1 pb-6 pt-2 sm:px-0 sm:pb-8 sm:pt-4">
        <div
          className="pointer-events-none absolute inset-0 -mx-3 sm:-mx-6 lg:-mx-8"
          style={{
            background: cover
              ? `linear-gradient(180deg, rgba(11,13,16,0.35) 0%, rgba(11,13,16,0.92) 78%, var(--bg) 100%),
                 linear-gradient(135deg, rgba(56,189,248,0.35), rgba(255,92,58,0.18) 55%, transparent),
                 url(${cover}) center/cover`
              : `linear-gradient(135deg, rgba(56,189,248,0.28) 0%, rgba(15,20,26,0.95) 45%, var(--bg) 100%)`,
          }}
        />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-7">
          <button
            type="button"
            onClick={onBack}
            className="absolute left-0 top-0 z-10 inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-ink-300 transition hover:bg-white/10 hover:text-mist sm:static sm:mb-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            All playlists
          </button>

          <div className="mx-auto mt-8 flex h-44 w-44 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-signal/80 via-ink-700 to-ember/50 shadow-[0_20px_50px_rgba(0,0,0,0.55)] sm:mx-0 sm:mt-0 sm:h-52 sm:w-52 lg:h-56 lg:w-56">
            {cover ? (
              <img src={cover} alt="" className="h-full w-full object-cover" />
            ) : (
              <ListMusic className="h-16 w-16 text-ink-950/70" strokeWidth={1.6} />
            )}
          </div>

          <div className="min-w-0 flex-1 pb-1 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-wide text-mist">Playlist</p>
            <h1 className="mt-1 font-display text-4xl font-extrabold leading-none tracking-tight text-mist sm:text-5xl lg:text-6xl">
              {playlist.name}
            </h1>
            {playlist.description ? (
              <p className="mt-3 line-clamp-2 text-sm text-ink-300">{playlist.description}</p>
            ) : null}
            <p className="mt-3 text-sm text-ink-200">
              <span className="font-semibold text-mist">{user?.name || 'You'}</span>
              <span className="text-ink-400">
                {' '}
                • {rows.length} {rows.length === 1 ? 'song' : 'songs'}
              </span>
            </p>
          </div>
        </div>
      </section>

      <div className="relative flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] pb-4 pt-2">
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            disabled={rows.length === 0}
            onClick={() => {
              if (playingInPlaylist) {
                onTogglePlay();
                return;
              }
              onPlayAll(tracks, 0);
            }}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-signal text-ink-950 shadow-lift transition hover:scale-105 disabled:opacity-40"
            title={playingInPlaylist ? 'Pause' : 'Play'}
          >
            {playingInPlaylist ? (
              <Pause className="h-6 w-6 fill-current" />
            ) : (
              <Play className="ml-0.5 h-6 w-6 fill-current" />
            )}
          </button>
          <button
            type="button"
            disabled={rows.length === 0}
            onClick={handleShuffle}
            className="rounded-full p-2 text-ink-400 transition hover:text-mist disabled:opacity-40"
            title="Shuffle"
          >
            <Shuffle className="h-6 w-6" />
          </button>
          <button
            type="button"
            disabled={rows.length === 0}
            onClick={onDownloadAll}
            className="rounded-full p-2 text-ink-400 transition hover:text-signal disabled:opacity-40"
            title="Download all"
          >
            <Download className="h-6 w-6" />
          </button>
        </div>

        <div className="flex w-full items-center gap-2 sm:w-auto">
          <div className="relative min-w-0 flex-1 sm:w-48 sm:flex-none">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find in playlist"
              className="field w-full rounded-lg py-2 pl-9 pr-3 text-xs"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="field rounded-lg py-2 pl-3 pr-8 text-xs"
            title="Sort"
          >
            <option value="custom">Custom order</option>
            <option value="title">Title</option>
            <option value="artist">Artist</option>
            <option value="added">Date added</option>
          </select>
        </div>
      </div>

      <div className="mt-2">
        {loading ? (
          <div className="px-2 py-16 text-center text-ink-400">Loading tracks...</div>
        ) : (
          <TrackTable
            rows={filtered}
            currentTrackId={currentTrackId}
            isPlaying={isPlaying}
            downloadsByTrack={downloadsByTrack}
            offlineTrackIds={offlineTrackIds}
            showAlbum
            showAdded
            emptyMessage={
              rows.length === 0
                ? 'This playlist is empty. Add tracks from search.'
                : 'No songs match your search.'
            }
            onPlayAt={(index) => onPlayAll(tracks, index)}
            onPlayTrack={onPlayTrack}
            onDownloadTrack={onDownloadTrack}
          />
        )}
      </div>
    </div>
  );
}
