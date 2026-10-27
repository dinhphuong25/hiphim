"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Star,
  Clock,
  Flame,
  Heart,
  Info,
  ChevronLeft,
  ChevronRight,
  Tv,
  Users,
  Clapperboard,
  Volume2,
  X,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/useLocalStorage";
import { useUserAuth } from "@/context/user-auth-context";
import { getMovieImageCandidates } from "@/lib/image-helper";

interface HeroMovie {
  slug: string;
  name: string;
  origin_name?: string;
  thumb_url?: string;
  poster_url?: string;
  content?: string;
  quality?: string;
  lang?: string;
  year?: number;
  time?: string;
  category?: { name: string; slug: string }[];
  country?: { name: string; slug: string }[];
  director?: string[] | string;
  actor?: string[] | string;
  imdb?: { rating?: number; vote_average?: number };
  tmdb?: { vote_average?: number };
  episode_current?: string;
  episode_total?: string;
  view?: number;
}

interface HeroSectionProps {
  movies: HeroMovie[];
}

const AUTO_SLIDE_DURATION = 7000; // 7 seconds per slide

function getAgeRating(movie: HeroMovie): string {
  const cats = Array.isArray(movie.category)
    ? movie.category.map((c) => c.name.toLowerCase()).join(" ")
    : "";
  if (cats.includes("kinh dị") || cats.includes("18+") || cats.includes("tội phạm"))
    return "T18";
  if (cats.includes("hành động") || cats.includes("chiến tranh") || cats.includes("hình sự"))
    return "T16";
  if (cats.includes("hoạt hình") || cats.includes("gia đình") || cats.includes("thiếu nhi"))
    return "P";
  return "T13";
}

function getEpisodeDisplay(movie: HeroMovie): string {
  if (movie.episode_current) {
    const cur = movie.episode_current.trim();
    if (cur.toLowerCase() === "full") return "Tập Hoàn Tất";
    if (movie.episode_total) return `Tập Hoàn Tất (${cur}/${movie.episode_total})`;
    return `Tập ${cur}`;
  }
  return "Bản Đẹp";
}

export default function HeroSection({ movies }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const { user, checkAuthOrPrompt, updateServerData } = useUserAuth();
  const { toggleFavorite, isFavorite } = useFavorites();

  const validMovies = useMemo(() => {
    return (movies || [])
      .filter((m) => m?.thumb_url || m?.poster_url)
      .slice(0, 10);
  }, [movies]);

  const current = validMovies[currentIndex] || validMovies[0];

  const backdropCandidates = useMemo(
    () => getMovieImageCandidates(current, "backdrop"),
    [current]
  );
  const [backdropIdx, setBackdropIdx] = useState(0);
  const [backdropError, setBackdropError] = useState(false);

  useEffect(() => {
    setBackdropIdx(0);
    setBackdropError(false);
    setProgress(0);
  }, [currentIndex]);

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || index === currentIndex) return;
      setIsTransitioning(true);
      setProgress(0);
      setTimeout(() => {
        setCurrentIndex(index);
        setIsTransitioning(false);
      }, 250);
    },
    [isTransitioning, currentIndex]
  );

  const next = useCallback(() => {
    if (validMovies.length <= 1) return;
    goTo((currentIndex + 1) % validMovies.length);
  }, [currentIndex, validMovies.length, goTo]);

  const prev = useCallback(() => {
    if (validMovies.length <= 1) return;
    goTo((currentIndex - 1 + validMovies.length) % validMovies.length);
  }, [currentIndex, validMovies.length, goTo]);

  // Live Auto-slide Progress Bar (100ms ticks)
  useEffect(() => {
    if (isPaused || validMovies.length <= 1) return;
    const intervalTime = 100;
    const increment = (intervalTime / AUTO_SLIDE_DURATION) * 100;

    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          next();
          return 0;
        }
        return prevProgress + increment;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPaused, next, validMovies.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "Escape") setShowInfoModal(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [next, prev]);

  // Touch Swipe Gestures for Mobile
  const touchStartXRef = useRef<number | null>(null);
  const touchEndXRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndXRef.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchEndXRef.current === null) return;
    const distance = touchStartXRef.current - touchEndXRef.current;
    const minSwipeDistance = 45;
    if (distance > minSwipeDistance) {
      next();
    } else if (distance < -minSwipeDistance) {
      prev();
    }
    touchStartXRef.current = null;
    touchEndXRef.current = null;
  };

  const thumbnailContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll active thumbnail into view (scrolls ONLY the thumbnail strip, never window/viewport)
  useEffect(() => {
    const container = thumbnailContainerRef.current;
    if (!container) return;
    const activeEl = container.children[currentIndex] as HTMLElement;
    if (activeEl) {
      const scrollLeft =
        activeEl.offsetLeft -
        container.offsetWidth / 2 +
        activeEl.offsetWidth / 2;
      container.scrollTo({ left: Math.max(0, scrollLeft), behavior: "smooth" });
    }
  }, [currentIndex]);

  if (!current || !current.slug) return null;

  const backdropUrl =
    !backdropError && backdropCandidates.length > 0
      ? backdropCandidates[backdropIdx]
      : "";

  const rawRating =
    current.imdb?.rating ||
    (current.imdb as any)?.vote_average ||
    current.tmdb?.vote_average;
  const rating = Number(rawRating);
  const displayRating = !isNaN(rating) && rating > 0 ? rating.toFixed(1) : "8.5";

  // Clean HTML from content string
  const cleanContent = current.content
    ? current.content
        .replace(/<[^>]*>/g, "")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ")
        .trim()
    : "";

  const categories = Array.isArray(current.category) ? current.category : [];
  const ageRating = getAgeRating(current);
  const episodeStatus = getEpisodeDisplay(current);

  const actorsList = Array.isArray(current.actor)
    ? current.actor.filter(Boolean).slice(0, 4).join(", ")
    : typeof current.actor === "string" && current.actor
    ? current.actor
    : "";

  const directorName = Array.isArray(current.director)
    ? current.director.filter(Boolean).join(", ")
    : typeof current.director === "string" && current.director && current.director !== "Đang cập nhật"
    ? current.director
    : "";

  const handleFavorite = () => {
    if (!current) return;
    if (!checkAuthOrPrompt("lưu phim yêu thích")) return;
    const isFav = isFavorite(current.slug);
    const willBeFav = !isFav;
    const updated = toggleFavorite({
      slug: current.slug,
      name: current.name,
      thumb_url: backdropUrl,
      year: current.year,
      quality: current.quality,
    });
    if (user && updated) {
      updateServerData({ favorites: updated });
    }
    if (willBeFav) {
      toast.success(`Đã thêm "${current.name}" vào danh sách yêu thích!`);
    } else {
      toast.info(`Đã xóa khỏi danh sách yêu thích`);
    }
  };

  return (
    <>
      <section
        className="relative w-full overflow-hidden select-none bg-cinema-bg touch-pan-y min-h-0 sm:min-h-[clamp(560px,68vh,680px)]"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        aria-label="Phim Nổi Bật Trên Trang Chủ"
      >
        {/* 1. Backdrop Background Image with Smooth Cross-fade */}
        <div
          className={cn(
            "absolute inset-0 w-full h-full transition-[opacity,transform] duration-700 ease-out transform-gpu will-change-transform will-change-opacity",
            isTransitioning ? "opacity-0 scale-105" : "opacity-100 scale-100"
          )}
        >
          {backdropUrl ? (
            <Image
              src={backdropUrl}
              alt={current.name}
              fill
              priority
              loading="eager"
              fetchPriority="high"
              className="object-cover object-center lg:object-[70%_center]"
              sizes="(max-width: 768px) 100vw, (max-width: 1440px) 100vw, 1920px"
              quality={90}
              onError={() => {
                if (backdropIdx + 1 < backdropCandidates.length) {
                  setBackdropIdx((i) => i + 1);
                } else {
                  setBackdropError(true);
                }
              }}
            />
          ) : (
            <div className="absolute inset-0 bg-[#070b09]" />
          )}

          {/* Desktop Cinematic Vignette & Deep Text Scrim */}
          <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-[#050807] via-[#050807]/90 via-38% to-transparent w-[70%] lg:w-[58%] pointer-events-none" />

          {/* Mobile Full Scrim */}
          <div className="md:hidden absolute inset-0 bg-gradient-to-t from-[#050807] via-[#050807]/85 via-60% to-transparent pointer-events-none" />

          {/* Smooth bottom blend into subsequent page sections */}
          <div className="absolute bottom-0 left-0 right-0 h-20 sm:h-32 bg-gradient-to-t from-[#050807] via-[#050807]/60 to-transparent pointer-events-none" />

          {/* Subtle top shade for top nav readability */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-[#050807]/80 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* 2. Main Content Container */}
        <div className="relative z-20 h-full max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 flex flex-col justify-start lg:justify-center pt-20 sm:pt-24 lg:pt-24 pb-2 sm:pb-8 min-h-0 sm:min-h-[inherit]">
          <div className="w-full max-w-xl lg:max-w-2xl space-y-3.5 sm:space-y-4 relative z-30">
            
            {/* Top Trending Ribbon Badge */}
            <div className="flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-green/12 border border-brand-green/30 text-brand-green text-[11px] font-bold uppercase tracking-wider shadow-[0_0_12px_rgba(32,214,107,0.2)]">
                <Flame className="w-3 h-3 fill-brand-green text-brand-green" />
                <span>TOP #{String(currentIndex + 1).padStart(2, "0")} THỊNH HÀNH</span>
              </div>
            </div>

            {/* Movie Title & Origin Name */}
            <div
              className={cn(
                "transition-all duration-400 space-y-1",
                isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
              )}
            >
              <h1 className="text-lg sm:text-xl md:text-2xl lg:text-[27px] font-bold text-white leading-snug tracking-tight uppercase drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)] line-clamp-2">
                {current.name}
              </h1>
              {current.origin_name && current.origin_name !== current.name && (
                <p className="text-xs sm:text-[12px] text-white/50 font-medium tracking-wide drop-shadow-md italic line-clamp-1">
                  {current.origin_name}
                </p>
              )}
            </div>

            {/* Comprehensive Metadata Badges Strip (IMDb, 4K, T15, Year, Episode...) */}
            <div
              className={cn(
                "flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs text-white/85 transition-all duration-400 font-medium",
                isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
              )}
            >
              {/* IMDb Rating Badge */}
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400/15 border border-amber-400/30 text-amber-300 font-bold shadow-xs">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <span>IMDb {displayRating}</span>
              </div>

              {/* Quality Badge */}
              <span className="px-2 py-0.5 rounded-md bg-white/[0.08] border border-white/15 text-white font-bold tracking-wide">
                {current.quality || "4K"}
              </span>

              {/* Age Classification Badge */}
              <span className="px-2 py-0.5 rounded-md bg-white/[0.08] border border-white/15 text-white/90 font-semibold">
                {ageRating}
              </span>

              {/* Year Badge */}
              {current.year && (
                <span className="px-2 py-0.5 rounded-md bg-white/[0.08] border border-white/15 text-white/80">
                  {current.year}
                </span>
              )}

              {/* Episode Status Badge */}
              <span className="px-2 py-0.5 rounded-md bg-white/[0.08] border border-white/15 text-white/80">
                {episodeStatus}
              </span>

              {/* Lang/Audio Badge */}
              {current.lang && (
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-white/[0.08] border border-white/15 text-white/80">
                  {current.lang}
                </span>
              )}
            </div>

            {/* Category / Genre Pills */}
            {categories.length > 0 && (
              <div
                className={cn(
                  "flex flex-wrap items-center gap-1.5 pt-0.5 transition-all duration-400",
                  isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                )}
              >
                {categories.slice(0, 4).map((cat, idx) => (
                  <Link
                    key={`${cat.slug}-${idx}`}
                    href={`/?category=${cat.slug}`}
                    className="px-2.5 py-0.5 rounded-lg bg-white/[0.06] hover:bg-brand-green/20 hover:text-brand-green hover:border-brand-green/40 border border-white/10 text-white/70 text-[11.5px] font-medium transition-all"
                  >
                    {cat.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Storyline / Synopsis */}
            {cleanContent && (
              <p
                className={cn(
                  "text-xs sm:text-[13px] text-white/70 leading-relaxed line-clamp-2 sm:line-clamp-3 max-w-lg transition-all duration-400 font-normal drop-shadow-md pt-0.5",
                  isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
                )}
              >
                {cleanContent}
              </p>
            )}

            {/* Action Buttons Strip */}
            <div
              className={cn(
                "flex items-center gap-3 pt-1.5 sm:pt-2 transition-all duration-400",
                isTransitioning ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"
              )}
            >
              {/* Button 1: Circular Play Button (Hi Phim Emerald) */}
              <Link
                href={`/watch?slug=${current.slug}`}
                className="group w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-gradient-to-tr from-[#20D66B] via-[#2AE376] to-[#10B981] hover:brightness-110 text-black flex items-center justify-center shadow-[0_0_24px_rgba(32,214,107,0.5)] hover:scale-106 active:scale-95 transition-all shrink-0 cursor-pointer"
                title="Xem phim ngay"
                aria-label="Xem phim ngay"
              >
                <Play className="w-5 h-5 fill-black text-black ml-0.5 group-hover:scale-110 transition-transform" />
              </Link>

              {/* Button 2: Round Heart Favorite Button */}
              <button
                onClick={handleFavorite}
                aria-label="Lưu phim yêu thích"
                title="Lưu phim yêu thích"
                className={cn(
                  "w-10 h-10 sm:w-11 sm:h-11 rounded-full border flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer",
                  isFavorite(current.slug)
                    ? "bg-brand-green/20 border-brand-green/60 text-brand-green shadow-[0_0_12px_rgba(32,214,107,0.3)]"
                    : "bg-black/50 hover:bg-white/15 border-white/15 text-white/80"
                )}
              >
                <Heart
                  className={cn(
                    "w-4.5 h-4.5",
                    isFavorite(current.slug) ? "fill-brand-green text-brand-green" : "text-white/80"
                  )}
                />
              </button>

              {/* Button 3: Round Info Button */}
              <button
                onClick={() => setShowInfoModal(true)}
                aria-label="Xem thông tin chi tiết phim"
                title="Xem thông tin chi tiết phim"
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/50 hover:bg-white/15 border border-white/15 text-white/80 flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer"
              >
                <Info className="w-4.5 h-4.5 text-white/80" />
              </button>
            </div>

            {/* Mobile Thumbnails Row (Touch scrollable) */}
            <div className="sm:hidden pt-2 w-full">
              <div
                ref={thumbnailContainerRef}
                className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-0"
              >
                {validMovies.map((movie, idx) => {
                  const thumbCands = getMovieImageCandidates(movie, "backdrop");
                  const thumb = thumbCands[0] || movie.thumb_url || movie.poster_url || "";
                  const isActive = idx === currentIndex;
                  return (
                    <button
                      key={movie.slug}
                      type="button"
                      onClick={() => goTo(idx)}
                      className={cn(
                        "relative w-20 h-12 rounded-lg overflow-hidden shrink-0 border transition-all duration-300 text-left",
                        isActive
                          ? "ring-2 ring-brand-green border-brand-green opacity-100 scale-102 shadow-[0_0_12px_rgba(32,214,107,0.4)]"
                          : "border-white/20 opacity-55 hover:opacity-100"
                      )}
                    >
                      {thumb ? (
                        <Image
                          src={thumb}
                          alt={movie.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#111]" />
                      )}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                          <div
                            className="h-full bg-brand-green transition-all duration-100 ease-linear"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* 3. Bottom-Right Mini Preview Carousel Strip (Desktop exact Cobephim design) */}
          {validMovies.length > 1 && (
            <div className="hidden sm:flex absolute bottom-8 right-6 lg:right-12 z-30 items-center gap-2 max-w-[55%] xl:max-w-[48%] bg-black/40 backdrop-blur-xl p-2 rounded-2xl border border-white/10 shadow-2xl">
              <button
                type="button"
                onClick={prev}
                aria-label="Phim trước"
                className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-brand-green hover:text-black hover:border-brand-green border border-white/15 flex items-center justify-center text-white/80 transition-all active:scale-90 cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div
                ref={thumbnailContainerRef}
                className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 px-0.5"
              >
                {validMovies.map((movie, idx) => {
                  const thumbCands = getMovieImageCandidates(movie, "backdrop");
                  const thumb = thumbCands[0] || movie.thumb_url || movie.poster_url || "";
                  const isActive = idx === currentIndex;
                  return (
                    <button
                      key={movie.slug}
                      type="button"
                      onClick={() => goTo(idx)}
                      className={cn(
                        "group relative w-20 lg:w-22 xl:w-26 h-12 lg:h-13 xl:h-15 rounded-xl overflow-hidden shrink-0 border transition-all duration-300 cursor-pointer",
                        isActive
                          ? "ring-2 ring-brand-green border-brand-green opacity-100 scale-105 shadow-[0_0_16px_rgba(32,214,107,0.45)] z-10"
                          : "border-white/15 opacity-55 hover:opacity-100 hover:scale-102"
                      )}
                      title={movie.name}
                    >
                      {thumb ? (
                        <Image
                          src={thumb}
                          alt={movie.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                          sizes="(max-width: 1024px) 80px, 104px"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#111]" />
                      )}

                      {/* Active timer progress line */}
                      {isActive && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/60">
                          <div
                            className="h-full bg-brand-green transition-all duration-100 ease-linear"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={next}
                aria-label="Phim tiếp theo"
                className="w-7 h-7 rounded-full bg-white/[0.08] hover:bg-brand-green hover:text-black hover:border-brand-green border border-white/15 flex items-center justify-center text-white/80 transition-all active:scale-90 cursor-pointer shrink-0"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. Quick Info Modal (Triggered by the Info circle button) */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div
            className="relative w-full max-w-2xl bg-[#0c120e] border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowInfoModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Đóng"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Poster Thumbnail */}
              <div className="relative w-36 sm:w-44 aspect-[2/3] rounded-2xl overflow-hidden shrink-0 border border-white/10 shadow-lg mx-auto sm:mx-0">
                <Image
                  src={
                    getMovieImageCandidates(current, "poster")[0] ||
                    backdropUrl ||
                    "/placeholder.svg"
                  }
                  alt={current.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Movie Meta */}
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-white uppercase leading-snug">
                    {current.name}
                  </h3>
                  {current.origin_name && (
                    <p className="text-xs sm:text-sm text-brand-green font-medium italic mt-0.5">
                      {current.origin_name}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="px-2.5 py-1 rounded-md bg-amber-400/20 text-amber-300 font-bold border border-amber-400/30">
                    IMDb {displayRating}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white/10 text-white font-bold border border-white/20">
                    {current.quality || "4K"}
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-white/10 text-white font-semibold border border-white/20">
                    {ageRating}
                  </span>
                  {current.year && (
                    <span className="px-2.5 py-1 rounded-md bg-white/10 text-white font-semibold border border-white/20">
                      {current.year}
                    </span>
                  )}
                  <span className="px-2.5 py-1 rounded-md bg-white/10 text-white font-semibold border border-white/20">
                    {episodeStatus}
                  </span>
                </div>

                {directorName && (
                  <div className="text-xs text-white/70">
                    <span className="text-white/40 font-medium">Đạo diễn: </span>
                    <span className="font-semibold text-white">{directorName}</span>
                  </div>
                )}

                {actorsList && (
                  <div className="text-xs text-white/70">
                    <span className="text-white/40 font-medium">Diễn viên: </span>
                    <span className="font-semibold text-white">{actorsList}</span>
                  </div>
                )}

                {cleanContent && (
                  <p className="text-xs sm:text-sm text-white/70 leading-relaxed max-h-36 overflow-y-auto pr-1">
                    {cleanContent}
                  </p>
                )}

                <div className="pt-2 flex items-center gap-3">
                  <Link
                    href={`/watch?slug=${current.slug}`}
                    className="flex-1 py-3 px-6 rounded-2xl bg-brand-green hover:bg-brand-green-hover text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(32,214,107,0.4)] transition-all active:scale-95"
                  >
                    <Play className="w-4 h-4 fill-black" />
                    <span>Xem Phim Ngay</span>
                  </Link>

                  <button
                    onClick={handleFavorite}
                    className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white transition-all active:scale-95"
                    title="Lưu yêu thích"
                  >
                    <Heart
                      className={cn(
                        "w-5 h-5",
                        isFavorite(current.slug) && "fill-brand-green text-brand-green"
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
