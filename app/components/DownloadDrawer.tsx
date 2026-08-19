'use client';

import React from 'react';
import { X, Download, CheckCircle2, AlertCircle, Loader2, Clock } from 'lucide-react';
import { DownloadTask } from '../lib/api';

interface DownloadDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  downloads: DownloadTask[];
}

export default function DownloadDrawer({ isOpen, onClose, downloads }: DownloadDrawerProps) {
  if (!isOpen) return null;

  const getStatusIcon = (status: DownloadTask['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-rose-400" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-400" />;
      default:
        return <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex justify-end">
      <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md glass-panel border-l border-white/10 h-full overflow-y-auto shadow-2xl">
        <div className="sticky top-0 z-10 p-4 border-b border-white/10 bg-slate-950/80 backdrop-blur flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" />
            <h2 className="font-bold text-white">Download Queue</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {downloads.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {downloads.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Download className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No download tasks yet</p>
              <p className="text-xs mt-1">Queue tracks for offline playback</p>
            </div>
          ) : (
            downloads.map((task) => (
              <div
                key={task.id}
                className="p-4 rounded-2xl bg-slate-900/60 border border-white/10 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-white text-sm truncate">{task.title}</h4>
                    <p className="text-xs text-slate-400 truncate">{task.artist}</p>
                  </div>
                  {getStatusIcon(task.status)}
                </div>

                <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5">
                    {task.source}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/5">
                    {task.format}
                  </span>
                  <span className="text-slate-500 capitalize">{task.status}</span>
                </div>

                {task.status !== 'completed' && task.status !== 'failed' && (
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${task.progress}%` }}
                    />
                  </div>
                )}

                {task.error_message && (
                  <p className="text-xs text-rose-400">{task.error_message}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
