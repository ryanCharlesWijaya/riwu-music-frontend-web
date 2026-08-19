'use client';

import React from 'react';
import { Play, Pause, Download, Plus, HardDrive, Layers, Clock, Disc, Video } from 'lucide-react';
import { MediaItem } from '../lib/api';

interface TrackCardProps {
  track: MediaItem;
  isPlaying: boolean;
  onPlay: (track: MediaItem) => void;
  onDownload: (track: MediaItem) => void;
  onAddToPlaylist: (track: MediaItem) => void;
}

export default function TrackCard({
  track,
  isPlaying,
  onPlay,
  onDownload,
  onAddToPlaylist,
}: TrackCardProps) {
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'youtube':
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30">
            <Video className="w-3 h-3" /> YouTube
          </span>
        );
      case 'gdrive':
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <HardDrive className="w-3 h-3" /> GDrive
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Layers className="w-3 h-3" /> Local
          </span>
        );
    }
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="group glass-panel rounded-2xl p-4 border border-white/10 hover:border-purple-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-900/20 flex flex-col justify-between">
      {/* Thumbnail Container */}
      <div className="relative aspect-video w-full rounded-xl overflow-hidden mb-3 bg-slate-900">
        <img
          src={track.thumbnail_url || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&q=80'}
          alt={track.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        <div className="absolute top-2 left-2">{getSourceBadge(track.source)}</div>

        <div className="absolute top-2 right-2 px-2 py-0.5 rounded bg-slate-950/80 backdrop-blur text-[10px] font-mono text-slate-300 border border-white/10 flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" />
          {formatDuration(track.duration)}
        </div>

        {/* Hover Overlay Play Button */}
        <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
          <button
            onClick={() => onPlay(track)}
            className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/50 hover:scale-110 transition-all"
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-1" />}
          </button>
        </div>
      </div>

      {/* Track Meta Details */}
      <div>
        <h3 className="font-bold text-base text-white truncate group-hover:text-purple-300 transition-colors">
          {track.title}
        </h3>
        <p className="text-xs text-slate-400 truncate mb-2">{track.artist}</p>

        <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-4">
          <span className="flex items-center gap-1 font-mono uppercase bg-slate-900/60 px-1.5 py-0.5 rounded border border-white/5">
            <Disc className="w-3 h-3 text-purple-400" /> {track.format}
          </span>
          <span>•</span>
          <span className="font-mono">{track.bitrate} kbps</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-white/5">
        <button
          onClick={() => onPlay(track)}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
            isPlaying
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-white/10'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isPlaying ? 'Playing' : 'Stream'}</span>
        </button>

        <button
          onClick={() => onAddToPlaylist(track)}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-white/10 transition"
          title="Add to playlist"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={() => onDownload(track)}
          className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 border border-white/10 transition"
          title="Download offline task"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
