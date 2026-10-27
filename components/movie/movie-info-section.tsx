"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Clapperboard, Film, Globe, Calendar, ChevronDown, ChevronUp, Sparkles, Tag } from "lucide-react";
import MovieSynopsis from "./movie-synopsis";

interface MovieInfoSectionProps {
  movie: {
    name: string;
    origin_name?: string;
    content?: string;
    year?: number;
    quality?: string;
    lang?: string;
    episode_current?: string;
    time?: string;
    actor?: string[];
    director?: string[];
    category?: Array<{ name: string; slug: string }>;
    country?: Array<{ name: string; slug: string }>;
    slug: string;
  };
}

export default function MovieInfoSection({ movie }: MovieInfoSectionProps) {
  const [showFullInfo, setShowFullInfo] = useState(false);

  const actors = Array.isArray(movie.actor)
    ? movie.actor.filter((a) => a && a.trim() && a !== "Đang cập nhật")
    : [];
  const directors = Array.isArray(movie.director)
    ? movie.director.filter((d) => d && d.trim() && d !== "Đang cập nhật")
    : [];
  const categories = Array.isArray(movie.category) ? movie.category : [];
  const countries = Array.isArray(movie.country) ? movie.country : [];

  return (
    <div className="w-full rounded-2xl bg-white/[0.02] border border-white/10 p-3.5 sm:p-5 space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-1.5 h-4 sm:h-5 bg-brand-green rounded-full shadow-[0_0_10px_rgba(32,214,107,0.8)]" />
          <h3 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
            Thông tin tác phẩm
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setShowFullInfo(!showFullInfo)}
          className="text-xs font-semibold text-brand-green hover:text-brand-green-hover flex items-center gap-1 cursor-pointer transition-colors active:scale-95"
        >
          <span>{showFullInfo ? "Thu gọn chi tiết" : "Xem đầy đủ diễn viên"}</span>
          {showFullInfo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Meta Pills (Year, Quality, Lang, Country) */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {movie.quality && (
          <span className="px-2.5 py-1 rounded-lg bg-brand-green/10 border border-brand-green/40 text-brand-green font-bold">
            {movie.quality}
          </span>
        )}
        {movie.lang && (
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/90 font-medium">
            {movie.lang}
          </span>
        )}
        {movie.year && (
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/80 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-white/50" />
            <span>{movie.year}</span>
          </span>
        )}
        {movie.time && (
          <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/80">
            {movie.time}
          </span>
        )}
        {countries.map((c) => (
          <Link
            key={c.slug}
            href={`/search?country=${c.slug}`}
            className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/80 hover:text-white hover:border-white/30 transition-colors flex items-center gap-1"
          >
            <Globe className="w-3 h-3 text-white/50" />
            <span>{c.name}</span>
          </Link>
        ))}
      </div>

      {/* Categories / Genres */}
      {categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs text-white/50 flex items-center gap-1 mr-1">
            <Tag className="w-3 h-3" />
            <span>Thể loại:</span>
          </span>
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/search?category=${cat.slug}`}
              className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs bg-white/5 hover:bg-brand-green/15 text-white/80 hover:text-brand-green border border-white/10 hover:border-brand-green/40 transition-all"
            >
              {cat.name}
            </Link>
          ))}
        </div>
      )}

      {/* Synopsis Component */}
      {movie.content && (
        <MovieSynopsis content={movie.content} variant="default" className="mt-1" />
      )}

      {/* Directors & Actors (Clickable Badges) */}
      {(directors.length > 0 || actors.length > 0) && (
        <div className={`space-y-3 pt-2 border-t border-white/10 ${showFullInfo ? "block" : "block"}`}>
          {directors.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-white/60 flex items-center gap-1.5">
                <Clapperboard className="w-3.5 h-3.5 text-brand-green" />
                <span>Đạo diễn:</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {directors.map((director, idx) => (
                  <Link
                    key={idx}
                    href={`/search?query=${encodeURIComponent(director)}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-brand-green/20 text-xs text-white/90 hover:text-white border border-white/10 hover:border-brand-green/50 transition-all group"
                    title={`Xem các phim của đạo diễn ${director}`}
                  >
                    <span>{director}</span>
                    <Sparkles className="w-2.5 h-2.5 text-brand-green/50 group-hover:text-brand-green" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {actors.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-white/60 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-green" />
                <span>Diễn viên ({actors.length}):</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(showFullInfo ? actors : actors.slice(0, 8)).map((actor, idx) => (
                  <Link
                    key={idx}
                    href={`/search?query=${encodeURIComponent(actor)}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-brand-green/20 text-xs text-white/90 hover:text-white border border-white/10 hover:border-brand-green/50 transition-all group"
                    title={`Xem tất cả phim có diễn viên ${actor}`}
                  >
                    <span>{actor}</span>
                    <Sparkles className="w-2.5 h-2.5 text-brand-green/50 group-hover:text-brand-green" />
                  </Link>
                ))}
                {!showFullInfo && actors.length > 8 && (
                  <button
                    type="button"
                    onClick={() => setShowFullInfo(true)}
                    className="px-2.5 py-1 rounded-lg bg-brand-green/10 text-brand-green text-xs font-semibold hover:bg-brand-green/20 transition-all cursor-pointer"
                  >
                    +{actors.length - 8} diễn viên khác...
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
