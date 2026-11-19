"use client";

import { memo, useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Play } from "lucide-react";
import MovieCardEditorial from "@/components/movie/movie-card-editorial";
import Top10Card from "@/components/movie/top10-card";
import FeaturedFocusImage from "@/components/movie/featured-focus-image";
import { filterHiddenMovies } from "@/lib/hidden-movies";

interface MovieSectionProps {
  indexNumber?: string;
  title: string;
  movies: any[];
  viewAllLink: string;
  variant?: "carousel" | "top10" | "featured" | "grid";
  emptyMessage?: string;
}

export const MovieSection = memo(function MovieSection({
  indexNumber = "01",
  title,
  movies = [],
  viewAllLink,
  variant = "carousel",
}: MovieSectionProps) {
  const filteredMovies = useMemo(() => filterHiddenMovies(movies || []), [movies]);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const [isMarqueeInView, setIsMarqueeInView] = useState(true);

  // Pause Top 10 infinite marquee GPU animation whenever scrolled out of viewport
  useEffect(() => {
    if (variant !== "top10") return;
    const el = marqueeRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const obs = new IntersectionObserver(
      ([entry]) => {
        setIsMarqueeInView(entry.isIntersecting);
      },
      { rootMargin: "120px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [variant]);

  if (!filteredMovies || filteredMovies.length === 0) return null;

  return (
    <section className="py-2 select-none" style={{ contentVisibility: "auto", containIntrinsicSize: "auto 450px" }}>
      {/* Editorial Header */}
      <div className="flex items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs font-mono font-bold text-brand-green tracking-wider shrink-0">
            {indexNumber}
          </span>
          <h2 className="text-base sm:text-xl font-black text-white tracking-wide uppercase truncate">
            {title}
          </h2>
          <div className="hidden sm:block flex-1 h-[1px] bg-white/8 min-w-[60px]" />
        </div>

        <Link
          href={viewAllLink}
          className="text-xs font-bold text-white/50 hover:text-brand-green transition-colors flex items-center gap-1 shrink-0 uppercase tracking-wider group"
        >
          <span>Xem Tất Cả</span>
          <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Variant 1: Top 10 Magazine Layout (Viewport-Aware Marquee — 0% GPU burn when offscreen) */}
      {variant === "top10" && (
        <div ref={marqueeRef} className="flex items-center overflow-hidden pb-4 group/marquee relative w-full mask-edges">
          <div
            className="flex items-center gap-4 w-max animate-marquee hover:[animation-play-state:paused] transform-gpu"
            style={{ animationPlayState: isMarqueeInView ? "running" : "paused" }}
          >
            {[...filteredMovies.slice(0, 10), ...filteredMovies.slice(0, 10)].map((movie, idx) => (
              <div key={`${movie.slug}-${idx}`} className="w-[180px] sm:w-[210px] shrink-0">
                <Top10Card movie={movie} rank={(idx % 10) + 1} lazy={idx >= 6} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Variant 2: Featured Focus Layout (1 Large + 4 Small Grid) */}
      {variant === "featured" && filteredMovies.length >= 5 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5 items-start">
          {/* Big Featured Left Card (Spans 2 cols) */}
          <div className="col-span-2 sm:col-span-2 lg:col-span-2 group relative flex flex-col h-full select-none">
            <Link
              href={`/watch?slug=${filteredMovies[0].slug}`}
              aria-label={`Xem phim tiêu điểm ${filteredMovies[0].name}`}
              className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-cinema-surface border border-brand-green/30 group-hover:border-brand-green/60 transition-[transform,border-color,box-shadow] duration-200 group-hover:-translate-y-1.5 group-hover:scale-[1.015] shadow-xl group-hover:shadow-[0_10px_28px_rgba(32,214,107,0.22)] block"
            >
              <FeaturedFocusImage movie={filteredMovies[0]} />
              <div className="absolute inset-0 bg-gradient-to-t from-cinema-bg via-transparent to-transparent opacity-80 group-hover:opacity-45 transition-opacity" />

              <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded text-[10px] font-black bg-brand-green text-cinema-bg shadow-lg tracking-widest uppercase">
                TIÊU ĐIỂM
              </span>

              {/* Hover Play Button */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/45">
                <div className="w-14 h-14 rounded-full bg-brand-green flex items-center justify-center text-cinema-bg shadow-xl shadow-brand-green/30 scale-90 group-hover:scale-100 transition-transform">
                  <Play className="w-6 h-6 fill-cinema-bg ml-1" />
                </div>
              </div>
            </Link>

            <div className="mt-3 flex flex-col px-1">
              <h3 className="text-sm sm:text-base font-bold text-white hover:text-brand-green transition-colors line-clamp-1">
                <Link href={`/watch?slug=${filteredMovies[0].slug}`}>
                  {filteredMovies[0].name}
                </Link>
              </h3>
              <div className="flex items-center text-xs text-cinema-text-dim mt-1">
                <span>{filteredMovies[0].year || "2026"}</span>
                {filteredMovies[0].origin_name && <span className="mx-2 text-white/20">•</span>}
                {filteredMovies[0].origin_name && <span className="truncate max-w-[200px]">{filteredMovies[0].origin_name}</span>}
              </div>
            </div>
          </div>

          {/* 4 Small Grid Cards Right (Responsive full-row alignment across all breakpoints) */}
          {filteredMovies.slice(1, 5).map((movie, idx) => (
            <div key={movie.slug} className={idx === 3 ? "col-span-1 lg:hidden xl:block" : "col-span-1"}>
              <MovieCardEditorial movie={movie} />
            </div>
          ))}
        </div>
      )}

      {/* Variant 3: Standard Editorial Grid — Always fills 2 full rows on Desktop/Tablet & 3 full rows on Mobile (Zero empty slots) */}
      {(variant === "carousel" || (variant === "featured" && filteredMovies.length < 5)) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5">
          {filteredMovies.slice(0, 12).map((movie, idx) => {
            const visibilityClass =
              idx >= 10
                ? "hidden 2xl:block"
                : idx >= 8
                ? "hidden xl:block"
                : idx >= 6
                ? "hidden lg:block"
                : "";
            return (
              <div key={movie.slug} className={visibilityClass}>
                <MovieCardEditorial movie={movie} />
              </div>
            );
          })}
        </div>
      )}

      {/* Variant 4: Movie Grid — Full rows across every breakpoint (Zero orphan cards) */}
      {variant === "grid" && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5">
          {filteredMovies.slice(0, 12).map((movie, idx) => (
            <div key={movie.slug} className={idx >= 10 ? "xl:hidden 2xl:block" : ""}>
              <MovieCardEditorial movie={movie} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
});

export default MovieSection;
