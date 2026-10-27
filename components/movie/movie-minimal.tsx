"use client";

import { useLoading } from "@/components/ui/loading-context";
import { memo } from "react";
import Link from "next/link";
import OptimizedMoviePoster from "@/components/ui/optimized-movie-poster";

interface MovieMinimalProps {
  movie: any;
}

export default memo(function MovieMinimalCard({ movie }: MovieMinimalProps) {
  const { showLoading } = useLoading();

  const imageUrl = movie.poster_url?.startsWith("http")
    ? movie.poster_url
    : `https://phimimg.com/${movie.poster_url}`;

  return (
    <Link
      href={`/phim/${movie.slug}`}
      onClick={() => showLoading()}
      className="block h-full w-full text-left group"
      prefetch={false}
    >
      <div className="relative h-full w-full overflow-hidden rounded-xl bg-neutral-900 border border-white/5 transition-all duration-300 ease-out hover:scale-[1.03] hover:border-primary/30 hover:shadow-[0_0_25px_rgba(251,191,36,0.15)] aspect-[2/3] will-change-transform">
        {/* Skeleton */}
        <div className="absolute inset-0 bg-neutral-900 animate-pulse -z-10" />

        {/* Image */}
        <OptimizedMoviePoster
          src={imageUrl}
          alt={movie.name}
          priority={false}
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Quality badge */}
        <div className="absolute top-2 left-2 z-20">
          <span className="inline-flex items-center gap-1 bg-black/80 border border-white/10 px-2 py-0.5 text-[10px] font-bold text-primary rounded shadow-sm">
            {movie.quality || "HD"}
          </span>
        </div>

        {/* Play icon on hover */}
        <div className="hidden sm:flex absolute inset-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
          <div className="bg-primary/90 w-12 h-12 rounded-full flex items-center justify-center text-black shadow-lg">
            <svg className="w-5 h-5 ml-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Info bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-20">
          <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-2 leading-snug mb-1.5 group-hover:text-primary transition-colors">
            {movie.name}
          </h3>
          <div className="flex items-center justify-between text-[11px] font-medium text-white/70">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {movie.year}
            </span>
            {movie.episode_current && (
              <span className="text-primary font-bold">
                Tập {String(movie.episode_current).replace(/^[Tt]ập\s*/i, '').replace(/^0+/, '')}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}, (prevProps, nextProps) => {
  return prevProps.movie?.slug === nextProps.movie?.slug;
});
