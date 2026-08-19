'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Download, HardDrive, Layers, Video } from 'lucide-react';
import { MediaItem, API_BASE } from '../lib/api';

interface PlayerBarProps {
  currentTrack: MediaItem | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onDownloadTrack: (track: MediaItem) => void;
}

export default function PlayerBar({
  currentTrack,
  isPlaying,
  onPlayPause,
  onDownloadTrack,
}: PlayerBarProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(60);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (!audioRef.current) return;
    if (currentTrack) {
      audioRef.current.src = `${API_BASE}/media/stream?id=${currentTrack.id}`;
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentTrack]);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

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

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (!currentTrack) {
    return null;
  }

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'youtube':
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
            <Video className="w-3 h-3" /> YouTube
          </span>
        );
      case 'gdrive':
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <HardDrive className="w-3 h-3" /> GDrive Cloud
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Layers className="w-3 h-3" /> Local Disk
          </span>
        );
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-3 lg:px-8">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => onPlayPause()}
      />

      <div className="max-w-7xl mx-auto glass-panel rounded-2xl p-3 sm:p-4 shadow-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Track Thumbnail & Info */}
        <div className="flex items-center gap-3 w-full md:w-1/4">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden shadow-lg border border-white/10 flex-shrink-0 group">
            <img
              src={currentTrack.thumbnail_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80'}
              alt={currentTrack.title}
              className="w-full h-full object-cover"
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-slate-950/60 flex items-center justify-center">
                <div className="flex items-end h-5 px-1">
                  <span className="wave-bar"></span>
                  <span className="wave-bar"></span>
                  <span className="wave-bar"></span>
                  <span className="wave-bar"></span>
                </div>
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate">{currentTrack.title}</h4>
            <p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p>
            <div className="mt-1">{getSourceBadge(currentTrack.source)}</div>
          </div>
        </div>

        {/* Controls & Scrubber */}
        <div className="flex flex-col items-center gap-2 w-full md:w-2/4">
          <div className="flex items-center gap-4">
            <button className="text-slate-400 hover:text-white transition">
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={onPlayPause}
              className="w-11 h-11 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/40 hover:scale-105 transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>

            <button className="text-slate-400 hover:text-white transition">
              <SkipForward className="w-5 h-5" />
            </button>

            <button
              onClick={() => onDownloadTrack(currentTrack)}
              className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition border border-white/10"
              title="Download for offline playback"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>

          {/* Time & Progress Slider */}
          <div className="w-full flex items-center gap-3">
            <span className="text-[11px] font-mono text-slate-400 min-w-[36px] text-right">
              {formatTime(currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max={duration || 60}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400"
            />
            <span className="text-[11px] font-mono text-slate-400 min-w-[36px]">
              {formatTime(duration || 60)}
            </span>
          </div>
        </div>

        {/* Volume Control */}
        <div className="hidden md:flex items-center justify-end gap-3 w-1/4">
          <button onClick={toggleMute} className="text-slate-400 hover:text-white transition">
            {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="w-24 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
          />
        </div>
      </div>
    </div>
  );
}
