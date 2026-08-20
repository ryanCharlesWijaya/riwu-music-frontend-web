'use client';

import React, { useMemo } from 'react';
import { X, Download, CheckCircle2, AlertCircle, Loader2, Clock, WifiOff, HardDrive } from 'lucide-react';
import { DownloadTask } from '../lib/api';
import { OfflineTrackMeta } from '../lib/offlineStore';

interface DownloadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  downloads: DownloadTask[];
  offlineTracks: OfflineTrackMeta[];
  offlineTrackIds: Set<string>;
}

export default function DownloadDrawer({
  isOpen,
  onClose,
  downloads,
  offlineTracks,
  offlineTrackIds,
}: DownloadDrawerProps) {
  const entries = useMemo(() => {
    const byTrack = new Map<
      string,
      {
        key: string;
        title: string;
        artist: string;
        source?: string;
        format?: string;
        status: DownloadTask['status'] | 'cached';
        progress?: number;
        error?: string;
        offline: boolean;
      }
    >();

    for (const task of downloads) {
      byTrack.set(task.track_id, {
        key: task.id,
        title: task.title || task.track_id,
        artist: task.artist || '',
        source: task.source,
        format: task.format,
        status: task.status,
        progress: task.progress,
        error: task.error_message,
        offline: offlineTrackIds.has(task.track_id),
      });
    }

    for (const track of offlineTracks) {
      const existing = byTrack.get(track.trackId);
      if (existing) {
        existing.offline = true;
        if (existing.status !== 'completed') {
          existing.status = 'cached';
        }
        continue;
      }
      byTrack.set(track.trackId, {
        key: `offline-${track.trackId}`,
        title: track.title || track.trackId,
        artist: track.artist || '',
        format: track.mimeType.includes('mp4') || track.mimeType.includes('aac') ? 'm4a' : 'audio',
        status: 'cached',
        offline: true,
      });
    }

    return Array.from(byTrack.values());
  }, [downloads, offlineTracks, offlineTrackIds]);

  if (!isOpen) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
      case 'cached':
        return <CheckCircle2 className="h-4 w-4 text-signal" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-ember" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-amber-400" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-signal" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="absolute inset-0 bg-ink-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative h-full w-full max-w-md overflow-y-auto border-l border-white/[0.08] bg-ink-900/95 shadow-panel backdrop-blur-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/[0.06] bg-ink-950/80 p-4 backdrop-blur">
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-signal" />
            <h2 className="font-display font-bold text-mist">Offline library</h2>
            <span className="rounded-lg border border-signal/30 bg-signal/10 px-2 py-0.5 text-xs text-signal">
              {entries.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-ink-400 transition hover:bg-white/10 hover:text-mist"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="px-4 pt-3 text-xs text-ink-500">
          Songs cached on this device stay available without the server. VPS downloads sync here when online.
        </p>

        <div className="space-y-3 p-4">
          {entries.length === 0 ? (
            <div className="py-12 text-center text-ink-500">
              <HardDrive className="mx-auto mb-3 h-12 w-12 opacity-30" />
              <p className="text-sm">No offline songs yet</p>
              <p className="mt-1 text-xs">Download a track while online to keep it here</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.key} className="space-y-2 rounded-2xl border border-white/[0.06] bg-ink-950/50 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="truncate text-sm font-semibold text-mist">{entry.title}</h4>
                    <p className="truncate text-xs text-ink-400">{entry.artist}</p>
                  </div>
                  {getStatusIcon(entry.status)}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                  {entry.source && (
                    <span className="rounded-lg border border-white/10 bg-ink-800 px-2 py-0.5 text-ink-300">
                      {entry.source}
                    </span>
                  )}
                  {entry.format && (
                    <span className="rounded-lg border border-white/10 bg-ink-800 px-2 py-0.5 text-ink-300">
                      {entry.format}
                    </span>
                  )}
                  <span className="capitalize text-ink-500">
                    {entry.status === 'cached' ? 'on device' : entry.status}
                  </span>
                </div>

                {entry.status !== 'completed' &&
                  entry.status !== 'failed' &&
                  entry.status !== 'cached' &&
                  typeof entry.progress === 'number' && (
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
                      <div className="h-full bg-signal transition-all duration-300" style={{ width: `${entry.progress}%` }} />
                    </div>
                  )}

                {entry.offline && (
                  <div className="flex items-center gap-2 text-xs text-signal">
                    <WifiOff className="h-3.5 w-3.5" />
                    Ready for offline playback
                  </div>
                )}

                {entry.error && <p className="text-xs text-ember">{entry.error}</p>}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
