'use client';

import React from 'react';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden />;
}

export function HeroSkeleton({ withBack = false }: { withBack?: boolean }) {
  return (
    <section className="relative overflow-hidden px-4 pb-6 pt-2 sm:px-5 sm:pb-8 sm:pt-4 lg:px-6">
      <div className="pointer-events-none absolute inset-0 -mx-3 bg-gradient-to-br from-signal/10 via-ink-900/80 to-[var(--bg)] sm:-mx-6 lg:-mx-8" />
      {withBack ? <Skeleton className="relative mb-4 h-4 w-28 rounded-md" /> : null}
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-7">
        <Skeleton className="mx-auto h-40 w-40 shrink-0 rounded-md sm:mx-0 sm:h-48 sm:w-48 lg:h-52 lg:w-52" />
        <div className="flex min-w-0 flex-1 flex-col items-center gap-3 pb-1 sm:items-start">
          <Skeleton className="h-3 w-16 rounded-md" />
          <Skeleton className="h-10 w-48 rounded-md sm:h-12 sm:w-72" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>
      </div>
    </section>
  );
}

export function TrackTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="w-full" role="status" aria-label="Loading tracks">
      <div className="mb-2 hidden grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,0.7fr)_5rem_5rem_4rem] gap-2 border-b border-white/[0.06] px-2 pb-3 text-[11px] uppercase tracking-wider text-ink-500 md:grid lg:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,0.7fr)_5rem_7rem_4rem]">
        <Skeleton className="h-3 w-4 rounded" />
        <Skeleton className="h-3 w-12 rounded" />
        <Skeleton className="hidden h-3 w-14 rounded md:block" />
        <Skeleton className="hidden h-3 w-12 rounded sm:block" />
        <Skeleton className="ml-auto h-3 w-8 rounded" />
      </div>
      <div className="divide-y divide-white/[0.04]">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-2 py-2.5 sm:grid sm:grid-cols-[2.5rem_minmax(0,1fr)_auto] sm:gap-2 md:grid-cols-[2.5rem_minmax(0,1fr)_minmax(0,0.7fr)_5rem_4rem]"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <Skeleton className="h-4 w-4 rounded" />
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded" />
              <div className="min-w-0 flex-1 space-y-2">
                <Skeleton className="h-3.5 w-[70%] max-w-[14rem] rounded" />
                <Skeleton className="h-3 w-[45%] max-w-[9rem] rounded" />
              </div>
            </div>
            <Skeleton className="hidden h-3 w-24 rounded md:block" />
            <Skeleton className="hidden h-3 w-12 rounded sm:block" />
            <Skeleton className="ml-auto h-3 w-8 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function LibraryPageSkeleton({ withBack = false, rows = 8 }: { withBack?: boolean; rows?: number }) {
  return (
    <div className="animate-rise-in" role="status" aria-label="Loading">
      <HeroSkeleton withBack={withBack} />
      <div className="relative flex items-center gap-3 border-b border-white/[0.06] pb-4 pt-2">
        <Skeleton className="h-14 w-14 rounded-full" />
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="ml-auto h-9 w-32 rounded-xl" />
      </div>
      <div className="mt-2">
        <TrackTableSkeleton rows={rows} />
      </div>
    </div>
  );
}

export function PlaylistGridSkeleton({ cards = 6 }: { cards?: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading playlists">
      {Array.from({ length: cards }).map((_, i) => (
        <div key={i} className="surface rounded-2xl p-5">
          <Skeleton className="mb-4 h-28 w-full rounded-xl" />
          <Skeleton className="mb-2 h-5 w-2/3 rounded-md" />
          <Skeleton className="mb-4 h-3 w-1/2 rounded-md" />
          <Skeleton className="h-4 w-20 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export function HistorySkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2" role="status" aria-label="Loading history">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="surface flex items-center justify-between gap-3 rounded-xl px-3 py-3">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-3.5 w-2/3 max-w-[16rem] rounded" />
            <Skeleton className="h-3 w-1/3 max-w-[8rem] rounded" />
          </div>
          <Skeleton className="h-5 w-14 rounded-lg" />
        </div>
      ))}
    </div>
  );
}
