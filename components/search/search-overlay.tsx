"use client";

import { useState, useEffect, useRef, useMemo, useTransition, memo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search,
  X,
  Flame,
  Film,
  Star,
  ArrowRight,
  Loader2,
  LayoutGrid,
  List,
  Play,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  normalizeImageUrl,
  getMovieImageCandidates,
} from "@/lib/image-helper";

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// In-memory cache for ultra-fast instant searches and backspacing
const searchCache = new Map<string, { items: any[]; total: number }>();

const SearchMovieImage = memo(function SearchMovieImage({
  movie,
  className = "",
  priority = false,
}: {
  movie: any;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [hasError, setHasError] = useState(false);

  // Auto reset candidate index and error state when movie changes
  const movieIdentifier = movie?.slug || movie?.name || "";
  const [prevIdentifier, setPrevIdentifier] = useState(movieIdentifier);
  if (prevIdentifier !== movieIdentifier) {
    setPrevIdentifier(movieIdentifier);
    setCandidateIdx(0);
    setHasError(false);
  }

  const candidates = useMemo(
    () => getMovieImageCandidates(movie, "poster"),
    [movie?.thumb_url, movie?.poster_url]
  );
  const src = !hasError && candidates.length > 0 ? candidates[candidateIdx] : null;

  if (!src) {
    return (
      <div className="w-full h-full bg-[#0c1410] flex flex-col items-center justify-center text-white/30 p-2 select-none">
        <Film className="w-8 h-8 mb-1.5 text-brand-green/40" />
        <span className="text-[10px] text-white/40 text-center line-clamp-2 px-1 font-medium">
          {movie?.name}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0c1410]">
      <img
        src={src}
        alt={movie.name || "Poster phim"}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={cn(
          "w-full h-full object-cover transition-transform duration-300",
          className
        )}
        onError={() => {
          if (candidateIdx + 1 < candidates.length) {
            setCandidateIdx((i) => i + 1);
          } else {
            setHasError(true);
          }
        }}
      />
    </div>
  );
});

const SearchGridCard = memo(function SearchGridCard({
  movie,
  isSelected,
  priority,
  onClose,
}: {
  movie: any;
  isSelected: boolean;
  priority: boolean;
  onClose: () => void;
}) {
  const rating = movie.imdb?.vote_average || movie.tmdb?.vote_average;

  return (
    <Link
      href={`/phim/${movie.slug}`}
      onClick={onClose}
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden bg-[#0c1310] border transition-[transform,border-color] duration-150",
        isSelected
          ? "border-brand-green ring-2 ring-brand-green/60 scale-[1.02]"
          : "border-white/10 hover:border-brand-green/60 hover:scale-[1.02]"
      )}
      style={{ contain: "content" }}
    >
      {/* Large Poster Aspect 2:3 */}
      <div className="relative w-full aspect-[2/3] overflow-hidden bg-[#0a0f0d]">
        <SearchMovieImage
          movie={movie}
          priority={priority}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          className="group-hover:scale-105"
        />

        {/* Mask Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0c1310] via-transparent to-black/30 opacity-70 group-hover:opacity-30 transition-opacity pointer-events-none" />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 z-10 flex flex-wrap items-center gap-1 max-w-[80%] pointer-events-none">
          {movie.quality && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-black/90 text-white border border-white/20 shadow-sm">
              {movie.quality}
            </span>
          )}
          {movie.lang && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase bg-emerald-950/95 text-brand-green border border-brand-green/40 shadow-sm">
              {movie.lang.includes("Thuyết")
                ? "Thuyết Minh"
                : movie.lang.includes("Lồng")
                ? "Lồng Tiếng"
                : "Vietsub"}
            </span>
          )}
        </div>

        {/* Top Right: Episode current or Rating */}
        <div className="absolute top-2 right-2 z-10 pointer-events-none">
          {rating ? (
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/90 text-amber-300 border border-amber-400/30 text-[10px] font-bold shadow-sm">
              <Star className="w-2.5 h-2.5 fill-current" />
              {Number(rating).toFixed(1)}
            </span>
          ) : movie.episode_current ? (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-black/90 text-white/90 border border-white/20 shadow-sm">
              {movie.episode_current}
            </span>
          ) : null}
        </div>

        {/* Play overlay on hover */}
        <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="w-11 h-11 rounded-full bg-brand-green text-cinema-bg flex items-center justify-center shadow-[0_0_20px_rgba(32,214,107,0.6)] group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>
      </div>

      {/* Movie Info */}
      <div className="p-3 flex flex-col flex-1 justify-between bg-[#0c1310]">
        <div>
          <h4 className="text-sm sm:text-base font-bold text-white group-hover:text-brand-green transition-colors line-clamp-1">
            {movie.name}
          </h4>
          {movie.origin_name && (
            <p className="text-[11px] sm:text-xs text-white/50 line-clamp-1 mt-0.5">
              {movie.origin_name}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between text-[11px] text-white/40 mt-2.5 pt-2 border-t border-white/5">
          <span>{movie.year || "2026"}</span>
          {movie.category?.[0]?.name && (
            <span className="truncate max-w-[90px] text-white/60">
              {movie.category[0].name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
});

const SearchListCard = memo(function SearchListCard({
  movie,
  isSelected,
  priority,
  onClose,
}: {
  movie: any;
  isSelected: boolean;
  priority: boolean;
  onClose: () => void;
}) {
  const rating = movie.imdb?.vote_average || movie.tmdb?.vote_average;

  return (
    <Link
      href={`/phim/${movie.slug}`}
      onClick={onClose}
      className={cn(
        "flex items-center gap-3.5 sm:gap-4 p-3 sm:p-3.5 rounded-2xl border transition-[transform,border-color] duration-150 group relative bg-[#0c1310]",
        isSelected
          ? "border-brand-green ring-2 ring-brand-green/60 bg-brand-green/10"
          : "border-white/10 hover:border-brand-green/50 hover:bg-[#121c17]"
      )}
      style={{ contain: "content" }}
    >
      {/* Poster Thumbnail */}
      <div className="relative w-20 h-28 sm:w-24 sm:h-34 md:w-28 md:h-40 rounded-xl overflow-hidden bg-[#0a0f0d] shrink-0 border border-white/10 group-hover:border-brand-green/40 transition-colors">
        <SearchMovieImage
          movie={movie}
          priority={priority}
          sizes="(max-width: 768px) 96px, 120px"
          className="group-hover:scale-105"
        />
        {movie.quality && (
          <span className="absolute top-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/90 text-white border border-white/20">
            {movie.quality}
          </span>
        )}
        {movie.episode_current && (
          <span className="absolute bottom-1.5 left-1.5 z-10 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-black/90 text-brand-green border border-brand-green/30">
            {movie.episode_current}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <h4 className="text-sm sm:text-base md:text-lg font-bold text-white group-hover:text-brand-green transition-colors line-clamp-1">
            {movie.name}
          </h4>
          {movie.origin_name && (
            <p className="text-xs sm:text-sm text-white/50 line-clamp-1 mb-2">
              {movie.origin_name}
            </p>
          )}

          {/* Meta Tags */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-white/40 mb-2.5">
            {movie.year && (
              <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-white/70 font-semibold">
                {movie.year}
              </span>
            )}
            {rating && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                <Star className="w-3 h-3 fill-current" />
                {Number(rating).toFixed(1)}
              </span>
            )}
            {movie.time && (
              <span className="text-white/40 text-[11px]">
                {movie.time}
              </span>
            )}
          </div>

          {/* Category chips */}
          {movie.category && movie.category.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {movie.category.slice(0, 3).map((cat: any) => (
                <span
                  key={cat.id || cat.slug}
                  className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/8 text-white/60"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Action link */}
        <div className="flex items-center justify-between text-xs text-brand-green font-bold mt-2 pt-2 border-t border-white/5">
          <span className="flex items-center gap-1.5 group-hover:translate-x-0.5 transition-transform">
            Xem phim ngay
          </span>
          <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-brand-green group-hover:text-cinema-bg flex items-center justify-center transition-all text-white/50">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
});

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [, startTransition] = useTransition();

  // Focus input and lock root (html) & body scroll on open to keep ONLY the outermost scrollbar
  useEffect(() => {
    if (isOpen) {
      const html = document.documentElement;
      const body = document.body;
      const prevHtmlOverflow = html.style.overflow;
      const prevBodyOverflow = body.style.overflow;

      html.style.overflow = "hidden";
      body.style.overflow = "hidden";
      html.classList.add("search-overlay-open");
      body.classList.add("search-overlay-open");

      setTimeout(() => inputRef.current?.focus(), 50);

      return () => {
        html.style.overflow = prevHtmlOverflow;
        body.style.overflow = prevBodyOverflow;
        html.classList.remove("search-overlay-open");
        body.classList.remove("search-overlay-open");
      };
    } else {
      setQuery("");
      setResults([]);
      setTotalItems(0);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Global hotkey: '/' or 'Ctrl+K'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === "/" || (e.ctrlKey && e.key === "k")) && !isOpen) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Live search debounced 250ms with in-memory caching
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      startTransition(() => {
        setResults([]);
        setTotalItems(0);
      });
      setIsLoading(false);
      return;
    }

    const cacheKey = trimmed.toLowerCase();
    if (searchCache.has(cacheKey)) {
      const cached = searchCache.get(cacheKey)!;
      startTransition(() => {
        setResults(cached.items);
        setTotalItems(cached.total);
      });
      setIsLoading(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const [kkRes, nguoncRes] = await Promise.allSettled([
          fetch(
            `https://phimapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(
              trimmed
            )}&limit=18`,
            { signal: controller.signal }
          ).then(async (r) => (r.ok ? r.json() : null)),
          fetch(
            `https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(
              trimmed
            )}&page=1`,
            {
              signal: controller.signal,
              headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" },
            }
          ).then(async (r) => (r.ok ? r.json() : null)),
        ]);

        let kkItems: any[] = [];
        let kkTotal = 0;
        if (kkRes.status === "fulfilled" && kkRes.value?.data?.items) {
          const data = kkRes.value;
          const items = data.data?.items || [];
          kkTotal = data.data?.params?.pagination?.totalItems || items.length;
          const cdnDomain =
            data.data?.APP_DOMAIN_CDN_IMAGE || "https://phimimg.com";
          kkItems = items.map((item: any) => ({
            ...item,
            thumb_url: normalizeImageUrl(item.thumb_url, cdnDomain),
            poster_url: normalizeImageUrl(item.poster_url, cdnDomain),
          }));
        }

        let nguoncItems: any[] = [];
        let nguoncTotal = 0;
        if (
          nguoncRes.status === "fulfilled" &&
          nguoncRes.value?.status === "success" &&
          Array.isArray(nguoncRes.value?.items)
        ) {
          const data = nguoncRes.value;
          nguoncTotal = data.paginate?.total_items || data.items.length;
          nguoncItems = data.items.map((item: any) => {
            const year = item.created ? new Date(item.created).getFullYear() : (item.year || 2026);
            return {
              _id: item.id || item.slug,
              name: item.name,
              slug: item.slug,
              origin_name: item.original_name || item.name,
              thumb_url: normalizeImageUrl(item.thumb_url),
              poster_url: normalizeImageUrl(item.poster_url || item.thumb_url),
              year: isNaN(year) ? 2026 : year,
              quality: item.quality || "HD",
              lang: item.language || "Vietsub",
              episode_current: item.current_episode || "Full",
              category: [],
              country: [],
            };
          });
        }

        // Merge & deduplicate by slug and normalized name
        const merged: any[] = [];
        const seenSlugs = new Set<string>();
        const seenTitles = new Set<string>();

        for (const item of kkItems) {
          if (item.slug && !seenSlugs.has(item.slug)) {
            seenSlugs.add(item.slug);
            const key = item.name?.toLowerCase().trim();
            if (key) seenTitles.add(key);
            merged.push(item);
          }
        }

        for (const item of nguoncItems) {
          if (!item.slug || seenSlugs.has(item.slug)) continue;
          const key = item.name?.toLowerCase().trim();
          if (key && seenTitles.has(key)) continue;

          seenSlugs.add(item.slug);
          if (key) seenTitles.add(key);
          merged.push(item);
        }

        const total = (kkTotal || 0) + (nguoncTotal || 0);

        searchCache.set(cacheKey, { items: merged, total: total || merged.length });
        if (searchCache.size > 60) {
          const firstKey = searchCache.keys().next().value;
          if (firstKey) searchCache.delete(firstKey);
        }

        startTransition(() => {
          setResults(merged);
          setTotalItems(total || merged.length);
        });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          startTransition(() => {
            setResults([]);
            setTotalItems(0);
          });
        }
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && results[selectedIndex]) {
      router.push(`/watch?slug=${results[selectedIndex].slug}`);
      onClose();
    } else if (query.trim()) {
      router.push(`/search?query=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleKeyDownInput = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] overflow-y-auto bg-[#050807] overscroll-contain shadow-none search-scroll">
      <div className="min-h-full flex flex-col">
        {/* Sticky Search Header Container - Solid background to eliminate backdrop-blur lag */}
        <div className="sticky top-0 z-40 bg-[#050807]/95 backdrop-blur-md border-b border-white/5 shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
          <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4">
            <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 focus-within:border-white/20 transition-colors relative">
              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2.5 sm:gap-4 flex-1 mr-2 sm:mr-4"
              >
                <Search className="w-5 h-5 sm:w-7 sm:h-7 text-brand-green shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  aria-label="Tìm kiếm phim, diễn viên, thể loại"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSelectedIndex(-1);
                  }}
                  onKeyDown={handleKeyDownInput}
                  placeholder="Tìm kiếm phim, diễn viên, thể loại..."
                  className="w-full bg-transparent text-lg sm:text-2xl md:text-3xl font-bold text-white placeholder:text-white/30 focus:outline-none font-sans tracking-wide"
                />
                {isLoading && (
                  <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 text-brand-green animate-spin shrink-0" />
                )}
              </form>

              <button
                onClick={onClose}
                aria-label="Đóng tìm kiếm"
                className="p-2 sm:p-3 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-all shrink-0 active:scale-95"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Shortcuts & Mode Indicator */}
            <div className="hidden sm:flex items-center justify-between text-xs font-mono text-white/40 mt-2.5 px-1">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white/80 font-semibold">
                    ↑↓
                  </kbd>{" "}
                  Di chuyển
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white/80 font-semibold">
                    Enter
                  </kbd>{" "}
                  Xem phim
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-white/80 font-semibold">
                    ESC
                  </kbd>{" "}
                  Đóng
                </span>
              </div>

              {results.length > 0 && (
                <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
                  <button
                    type="button"
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all font-sans",
                      viewMode === "grid"
                        ? "bg-brand-green text-cinema-bg font-bold shadow-sm"
                        : "text-white/60 hover:text-white"
                    )}
                    title="Chế độ lưới"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Lưới</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-all font-sans",
                      viewMode === "list"
                        ? "bg-brand-green text-cinema-bg font-bold shadow-sm"
                        : "text-white/60 hover:text-white"
                    )}
                    title="Chế độ danh sách"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Danh sách</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results / Suggestions Container */}
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1">
          {query.trim().length === 0 ? null : results.length > 0 ? (
            /* Live Results */
            <div className="space-y-6">
              {/* Results Header Bar */}
              <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-white/6">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs sm:text-sm font-bold text-white/70 uppercase tracking-wider">
                    Kết Quả Gợi Ý ({results.length})
                  </span>
                  {totalItems > 0 && (
                    <span className="text-xs text-brand-green font-medium px-2.5 py-0.5 rounded-full bg-brand-green/15 border border-brand-green/25">
                      {totalItems} phim phù hợp
                    </span>
                  )}
                </div>
              </div>

              {/* View Mode: Grid View (Default - Large posters) */}
              {viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
                  {results.map((movie, idx) => (
                    <SearchGridCard
                      key={movie.slug}
                      movie={movie}
                      isSelected={idx === selectedIndex}
                      priority={idx < 6}
                      onClose={onClose}
                    />
                  ))}
                </div>
              ) : (
                /* View Mode: List View (Spacious 2-column detailed cards) */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {results.map((movie, idx) => (
                    <SearchListCard
                      key={movie.slug}
                      movie={movie}
                      isSelected={idx === selectedIndex}
                      priority={idx < 4}
                      onClose={onClose}
                    />
                  ))}
                </div>
              )}

              {/* Bottom: View All Results Action */}
              <div className="pt-4 pb-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    router.push(
                      `/search?query=${encodeURIComponent(query.trim())}`
                    );
                    onClose();
                  }}
                  className="px-6 py-3 rounded-xl bg-brand-green/10 hover:bg-brand-green text-brand-green hover:text-cinema-bg border border-brand-green/30 hover:border-brand-green font-bold text-sm sm:text-base transition-all duration-200 flex items-center gap-2 group shadow-lg active:scale-95"
                >
                  <span>
                    Xem toàn bộ kết quả cho "{query}" {totalItems > 0 ? `(${totalItems} phim)` : ""}
                  </span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ) : !isLoading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30">
                <Film className="w-8 h-8" />
              </div>
              <p className="text-white/70 text-base font-bold">
                Không tìm thấy kết quả phù hợp với "{query}"
              </p>
              <p className="text-white/40 text-xs sm:text-sm max-w-md">
                Thử tìm kiếm với tên gốc tiếng Anh, từ khóa ngắn hơn hoặc kiểm tra chính tả.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
