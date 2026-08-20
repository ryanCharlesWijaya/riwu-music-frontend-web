'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Download,
  HardDrive,
  Layers,
  Video,
  ListMusic,
} from 'lucide-react';
import { MediaItem, API_BASE, prefetchTracks } from '../lib/api';
import { getOfflineObjectUrl } from '../lib/offlineStore';

interface PlayerBarProps {
  currentTrack: MediaItem | null;
  isPlaying: boolean;
  queueCount: number;
  canSkipPrev: boolean;
  canSkipNext: boolean;
  onPlayPause: () => void;
  onSkipPrev: () => void;
  onSkipNext: () => void;
  onTrackEnded: () => void;
  onOpenQueue: () => void;
  onDownloadTrack: (track: MediaItem) => void;
  offlineTrackIds?: Set<string>;
}

export default function PlayerBar({
  currentTrack,
  isPlaying,
  queueCount,
  canSkipPrev,
  canSkipNext,
  onPlayPause,
  onSkipPrev,
  onSkipNext,
  onTrackEnded,
  onOpenQueue,
  onDownloadTrack,
  offlineTrackIds,
}: PlayerBarProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const offlineIdsRef = useRef(offlineTrackIds);
  const isPlayingRef = useRef(isPlaying);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  offlineIdsRef.current = offlineTrackIds;
  isPlayingRef.current = isPlaying;

  // Only reload the audio element when the track changes — not when a background
  // download finishes and offlineTrackIds updates (that was restarting playback).
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;
    let cancelled = false;
    const trackId = currentTrack.id;

    const load = async () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      let src = `${API_BASE}/media/stream?id=${trackId}`;
      const offlineIds = offlineIdsRef.current;
      if (offlineIds?.has(trackId) || !navigator.onLine) {
        const offlineUrl = await getOfflineObjectUrl(trackId);
        if (offlineUrl) {
          objectUrlRef.current = offlineUrl;
          src = offlineUrl;
        } else if (!navigator.onLine) {
          return;
        } else {
          void prefetchTracks([trackId]);
        }
      } else {
        void prefetchTracks([trackId]);
      }

      if (cancelled || !audioRef.current) return;
      audioRef.current.src = src;
      setCurrentTime(0);
      if (isPlayingRef.current) {
        audioRef.current.play().catch(console.error);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [currentTrack?.id]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, []);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (audioRef.current) {
      audioRef.current.volume = val;
    }
    setIsMuted(val === 0);
  };

  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = volume || 0.8;
        setIsMuted(false);
      } else {
        audioRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  const handleSkipPrev = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    onSkipPrev();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!currentTrack) {
    return null;
  }

  const sourceBadge = (source: string) => {
    switch (source) {
      case 'youtube':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-ember">
            <Video className="h-3 w-3" /> YouTube
          </span>
        );
      case 'gdrive':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-teal-300">
            <HardDrive className="h-3 w-3" /> GDrive
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

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] animate-player-in lg:left-[17.5rem] lg:px-6">
      <audio ref={audioRef} crossOrigin="anonymous" onTimeUpdate={handleTimeUpdate} onEnded={onTrackEnded} />

      <div className="mx-auto flex w-full max-w-none flex-col gap-3 rounded-2xl border border-white/[0.08] bg-ink-900/90 p-3 shadow-panel backdrop-blur-2xl sm:p-4 md:flex-row md:items-center md:justify-between md:gap-4">
        <div className="flex w-full items-center gap-3 md:w-[28%]">
          <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl border border-white/10">
            <img
              src={currentTrack.thumbnail_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80'}
              alt=""
              className="h-full w-full object-cover"
            />
            {isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center bg-ink-950/55">
                <div className="flex h-5 items-end px-1">
                  <span className="wave-bar" />
                  <span className="wave-bar" />
                  <span className="wave-bar" />
                  <span className="wave-bar" />
                </div>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="truncate font-display text-sm font-bold text-mist">{currentTrack.title}</h4>
            <p className="truncate text-xs text-ink-400">{currentTrack.artist}</p>
            <div className="mt-1">{sourceBadge(currentTrack.source)}</div>
          </div>
        </div>

        <div className="flex w-full flex-col items-center gap-2 md:w-[44%]">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={handleSkipPrev}
              disabled={!canSkipPrev && currentTime <= 3}
              className="text-ink-400 transition hover:text-mist disabled:opacity-30"
              title="Previous"
            >
              <SkipBack className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={onPlayPause}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-signal text-ink-950 shadow-lift transition hover:scale-105"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 fill-current" />
              ) : (
                <Play className="ml-0.5 h-5 w-5 fill-current" />
              )}
            </button>

            <button
              type="button"
              onClick={onSkipNext}
              disabled={!canSkipNext}
              className="text-ink-400 transition hover:text-mist disabled:opacity-30"
              title="Next"
            >
              <SkipForward className="h-5 w-5" />
            </button>

            <button
              type="button"
              onClick={() => onDownloadTrack(currentTrack)}
              className="rounded-xl border border-white/10 bg-white/[0.04] p-2 text-ink-300 transition hover:border-ember/40 hover:text-ember"
              title="Download for offline"
            >
              <Download className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onOpenQueue}
              className="relative rounded-xl border border-white/10 bg-white/[0.04] p-2 text-signal transition hover:border-signal/40"
              title="Open queue"
            >
              <ListMusic className="h-4 w-4" />
              {queueCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-signal px-1 text-[10px] font-bold text-ink-950">
                  {queueCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex w-full items-center gap-3">
            <span className="min-w-[36px] text-right font-mono text-[11px] text-ink-400">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 60}
              value={currentTime}
              onChange={handleSeek}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-ink-700"
            />
            <span className="min-w-[36px] font-mono text-[11px] text-ink-400">
              {formatTime(duration || 60)}
            </span>
          </div>
        </div>

        <div className="hidden w-1/4 items-center justify-end gap-3 md:flex">
          <button type="button" onClick={toggleMute} className="text-ink-400 transition hover:text-mist">
            {isMuted ? <VolumeX className="h-5 w-5 text-ember" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="h-1.5 w-24 cursor-pointer appearance-none rounded-lg bg-ink-700"
          />
        </div>
      </div>
    </div>
  );
}
