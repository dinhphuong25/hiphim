"use client";

import { memo, useCallback, useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLoading } from "@/components/ui/loading-context";

const LazyImage = memo(function LazyImage({
  src,
  alt,
  className = "",
  priority = false
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(priority);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (priority || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "800px", threshold: 0.01 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView]);

  const imageSrc = src?.startsWith("http") ? src : `https://phimimg.com/${src}`;

  return (
    <div ref={imgRef} className={`relative ${className}`} style={{ contentVisibility: "auto", containIntrinsicSize: "auto 400px" }}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-900/30 animate-pulse" />
      )}

      {isInView && (
        <Image
          src={hasError ? "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 300 450'%3E%3Crect width='300' height='450' fill='%23111714'/%3E%3C/svg%3E" : imageSrc}
          alt={alt}
          fill
          quality={75}
          decoding="async"
          loading={priority ? "eager" : "lazy"}
          sizes="(max-width: 480px) 160px, (max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          priority={priority}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          className={`object-cover transition-opacity duration-300 ${isLoaded ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </div>
  );
});

// Clean, working movie card
export const MovieCardDefault = memo(function MovieCardDefault({ movie }: { movie: any }) {
  const { showLoading } = useLoading();

  return (
    <Link 
      href={`/phim/${movie.slug}`} 
      onClick={() => showLoading()}
      className="block h-full w-full text-left group"
      prefetch={false}
    >
      <div className="relative h-full w-full overflow-hidden rounded-xl bg-black shadow-md hover:shadow-2xl hover:shadow-primary/20 transition-all duration-300 hover:scale-105">
        {/* Image */}
        <LazyImage
          src={movie.poster_url}
          alt={movie.name}
          className="absolute inset-0 w-full h-full group-hover:scale-110 transition-transform duration-500"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-30 group-hover:opacity-20 transition-opacity duration-300" />

        {/* Hover glow */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-primary/10 to-transparent" />

        {/* Quality badge */}
        <div className="absolute top-2 left-2 z-20">
          <span className="inline-flex bg-primary/30 backdrop-blur-md border border-primary/50 px-2.5 py-1 text-xs font-bold text-primary rounded-lg shadow-lg shadow-primary/20">
            {movie.quality || "HD"}
          </span>
        </div>

        {/* Play icon */}
        <div className="hidden sm:flex absolute inset-0 items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-10">
          <div className="bg-white/10 backdrop-blur-md w-16 h-16 rounded-full flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/30">
            <svg className="w-6 h-6 text-primary ml-0.5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Info bar */}
        <div className="absolute bottom-0 left-0 right-0 p-3 z-20 bg-gradient-to-t from-black/60 to-transparent border-t border-white/10">
          <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-2 leading-tight mb-1.5">
            {movie.name}
          </h3>
          <div className="flex items-center justify-between text-xs text-white/70">
            <span className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              {movie.year}
            </span>
            {movie.episode_current && (
              <span className="text-primary font-semibold">
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

export const MovieCardLarge = MovieCardDefault;
export const MovieCardWide = MovieCardDefault;
export const MovieCardCompact = MovieCardDefault;
