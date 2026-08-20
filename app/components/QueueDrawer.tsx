'use client';

import React from 'react';
import { X, ListMusic, Play, Trash2, GripVertical } from 'lucide-react';
import { MediaItem } from '../lib/api';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  queue: MediaItem[];
  currentIndex: number;
  onPlayAt: (index: number) => void;
  onRemoveAt: (index: number) => void;
  onClear: () => void;
}

export default function QueueDrawer({
  isOpen,
  onClose,
  queue,
  currentIndex,
  onPlayAt,
  onRemoveAt,
  onClear,
}: QueueDrawerProps) {
  if (!isOpen) return null;

  const nowPlaying = queue[currentIndex] ?? null;
  const upcoming = queue
    .map((track, index) => ({ track, index }))
    .filter(({ index }) => index > currentIndex);
  const earlier = queue
    .map((track, index) => ({ track, index }))
    .filter(({ index }) => index < currentIndex);

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative h-full w-full max-w-md overflow-y-auto border-l border-white/[0.08] bg-ink-900/95 shadow-panel backdrop-blur-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-ink-950/80 p-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <ListMusic className="h-5 w-5 text-signal" />
            <h2 className="font-display font-bold text-mist">Queue</h2>
            <span className="rounded-lg border border-signal/30 bg-signal/10 px-2 py-0.5 text-xs text-signal">
              {queue.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {queue.length > 0 && (
              <button
                type="button"
                onClick={onClear}
                className="rounded-lg px-2 py-1.5 text-xs text-ink-400 transition hover:bg-ember/10 hover:text-ember"
                title="Clear queue"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-ink-400 transition hover:bg-white/10 hover:text-mist"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6 p-4">
          {queue.length === 0 ? (
            <div className="py-12 text-center text-ink-500">
              <ListMusic className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p className="text-sm">Queue is empty</p>
              <p className="mt-1 text-xs">Play a track or add songs with the queue button</p>
            </div>
          ) : (
            <>
              {nowPlaying && (
                <section className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">
                    Now playing
                  </h3>
                  <div className="flex items-center gap-3 rounded-2xl border border-signal/30 bg-signal/10 p-3">
                    <img
                      src={nowPlaying.thumbnail_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80'}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-mist">{nowPlaying.title}</p>
                      <p className="truncate text-xs text-ink-400">{nowPlaying.artist}</p>
                    </div>
                  </div>
                </section>
              )}

              {upcoming.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">
                    Next up
                  </h3>
                  <div className="space-y-1">
                    {upcoming.map(({ track, index }) => (
                      <QueueRow
                        key={`${track.id}-${index}`}
                        track={track}
                        onPlay={() => onPlayAt(index)}
                        onRemove={() => onRemoveAt(index)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {earlier.length > 0 && (
                <section className="space-y-2">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">
                    Earlier
                  </h3>
                  <div className="space-y-1 opacity-70">
                    {earlier.map(({ track, index }) => (
                      <QueueRow
                        key={`${track.id}-${index}`}
                        track={track}
                        onPlay={() => onPlayAt(index)}
                        onRemove={() => onRemoveAt(index)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function QueueRow({
  track,
  onPlay,
  onRemove,
}: {
  track: MediaItem;
  onPlay: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-2 rounded-xl p-2 transition hover:bg-white/[0.04] group">
      <GripVertical className="h-4 w-4 shrink-0 text-ink-600" />
      <button type="button" onClick={onPlay} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <img
          src={track.thumbnail_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80'}
          alt=""
          className="h-10 w-10 rounded-lg object-cover"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-mist">{track.title}</p>
          <p className="truncate text-xs text-ink-400">{track.artist}</p>
        </div>
        <Play className="h-4 w-4 shrink-0 text-ink-500 opacity-0 group-hover:opacity-100" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-lg p-1.5 text-ink-500 opacity-0 transition hover:bg-ember/10 hover:text-ember group-hover:opacity-100"
        title="Remove from queue"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
