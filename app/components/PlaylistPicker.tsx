'use client';

import React, { useState } from 'react';
import { X, ListMusic, Plus } from 'lucide-react';
import { MediaItem, Playlist } from '../lib/api';

interface PlaylistPickerProps {
  isOpen: boolean;
  track: MediaItem | null;
  playlists: Playlist[];
  onClose: () => void;
  onSelect: (playlistId: string) => Promise<void>;
  onCreate: (name: string) => Promise<void>;
}

export default function PlaylistPicker({
  isOpen,
  track,
  playlists,
  onClose,
  onSelect,
  onCreate,
}: PlaylistPickerProps) {
  const [newName, setNewName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !track) return null;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await action();
      setNewName('');
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-950/75 backdrop-blur-md" onClick={onClose} />
      <div className="relative w-full max-w-md animate-rise-in overflow-hidden rounded-3xl border border-white/[0.08] bg-ink-900/95 shadow-panel backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-white/[0.06] p-5">
          <div>
            <div className="flex items-center gap-2 font-display font-bold text-mist">
              <ListMusic className="h-5 w-5 text-signal" />
              Add to playlist
            </div>
            <p className="mt-1 max-w-[280px] truncate text-xs text-ink-400">
              {track.title} — {track.artist}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-xl p-2 text-ink-400 hover:bg-white/10 hover:text-mist">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[50vh] space-y-2 overflow-y-auto p-5">
          {playlists.length === 0 ? (
            <p className="py-4 text-center text-sm text-ink-400">No playlists yet. Create one below.</p>
          ) : (
            playlists.map((pl) => (
              <button
                key={pl.id}
                type="button"
                disabled={busy}
                onClick={() => run(() => onSelect(pl.id))}
                className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/[0.06] bg-ink-950/50 p-3 text-left transition hover:border-signal/35"
              >
                <div className="min-w-0">
                  <div className="truncate font-semibold text-mist">{pl.name}</div>
                  <div className="text-xs text-ink-400">{pl.item_count} songs</div>
                </div>
                <Plus className="h-4 w-4 shrink-0 text-signal" />
              </button>
            ))
          )}
        </div>

        <div className="space-y-3 border-t border-white/[0.06] p-5">
          <label className="text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">
            Create playlist
          </label>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Playlist name"
              className="field flex-1 rounded-xl px-3 py-2.5 text-sm"
            />
            <button
              type="button"
              disabled={busy || !newName.trim()}
              onClick={() => run(() => onCreate(newName.trim()))}
              className="btn-signal rounded-xl px-4 py-2.5 text-sm disabled:opacity-50"
            >
              Create
            </button>
          </div>
          {error && <p className="text-xs text-ember">{error}</p>}
        </div>
      </div>
    </div>
  );
}
