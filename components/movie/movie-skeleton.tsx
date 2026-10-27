"use client";

import { memo } from "react";

export const MovieCardSkeleton = memo(function MovieCardSkeleton() {
  return (
    <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden bg-white/[0.03] border border-white/5 shadow-md">
      {/* Subtle glass shimmer overlay */}
      <div className="absolute inset-0 skeleton-shimmer bg-gradient-to-r from-transparent via-white/[0.04] to-transparent" />
      {/* Bottom text info placeholder */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="h-3.5 bg-white/10 rounded-md w-3/4 mb-1.5 animate-pulse" />
        <div className="h-2.5 bg-white/5 rounded-md w-1/2 animate-pulse" />
      </div>
    </div>
  );
});

export function MovieGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 animate-in fade-in duration-300">
      {Array.from({ length: count }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function SectionWithSkeleton({ title, count = 5 }: { title: string; count?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-1 sm:w-1.5 h-5 sm:h-7 bg-brand-green/40 rounded-full" />
        <h2 className="text-sm sm:text-xl font-bold text-white/50">{title}</h2>
      </div>
      <MovieGridSkeleton count={count} />
    </div>
  );
}

