"use client";

import { useState, useCallback, useRef, memo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import PhimApi from "@/libs/phimapi.com";
import { createPortal } from "react-dom";
import { getMovieImageCandidates } from "@/lib/image-helper";

function AutocompleteImage({ src, title }: { src?: string; title: string }) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[#0c1310]">
        <svg className="w-5 h-5 text-brand-green/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 16h4m10 0h4" />
        </svg>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={title}
      fill
      quality={70}
      sizes="60px"
      className="object-cover group-hover:scale-110 transition-transform duration-500"
      onError={() => setHasError(true)}
    />
  );
}

interface SearchSuggestion {
  type: "movie" | "category";
  title: string;
  subtitle?: string;
  slug?: string;
  image?: string;
  metadata?: string;
}

interface SearchPanelProps {
  open?: boolean;
  onClose: () => void;
  categories?: any[];
}

const TRENDING_SEARCHES = [
  "Phim bộ Trung Quốc",
  "Phim Hàn Quốc",
  "Phim hành động",
  "Anime Vietsub",
  "Phim kinh dị",
  "Phim tình cảm",
];

function SearchPanel({ open, onClose, categories = [] }: SearchPanelProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [mounted, setMounted] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cacheRef = useRef<Map<string, SearchSuggestion[]>>(new Map());
  const abortRef = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);

  // Auto-focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setQuery("");
      setSuggestions([]);
      setSelectedIndex(-1);
    }
  }, [open]);

  // Lock body scroll when open (with iOS fix)
  useEffect(() => {
    if (open) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) { setSuggestions([]); return; }

    const cached = cacheRef.current.get(searchQuery);
    if (cached) { setSuggestions(cached); return; }

    abortRef.current?.abort();
    abortRef.current = new AbortController();
    setIsLoading(true);

    try {
      const api = new PhimApi();
      const [movies] = await api.search(searchQuery, 1);
      const results: SearchSuggestion[] = [];

      if (movies && Array.isArray(movies)) {
        // Tối ưu hoá logic tìm kiếm: Đẩy các phim có tên khớp chính xác (hoặc bắt đầu bằng từ khoá) lên đầu
        const sortedMovies = [...movies].sort((a, b) => {
          const q = searchQuery.toLowerCase().trim();
          const nameA = (a.name || "").toLowerCase();
          const originA = (a.origin_name || "").toLowerCase();
          const nameB = (b.name || "").toLowerCase();
          const originB = (b.origin_name || "").toLowerCase();

          // Trọng số rlevancy:
          // 3: Khớp chính xác hoàn toàn (VD: gõ "mai" -> "Mai")
          // 2: Bắt đầu bằng từ khoá (VD: "mai" -> "Mai Hoa Phổ")
          // 1: Chứa từ khoá (VD: "mai" -> "Ngày mai")
          const weightA = (nameA === q || originA === q) ? 3 : (nameA.startsWith(q) ? 2 : (nameA.includes(` ${q} `) || nameA.includes(` ${q}`) || nameA.includes(`${q} `) ? 1 : 0));
          const weightB = (nameB === q || originB === q) ? 3 : (nameB.startsWith(q) ? 2 : (nameB.includes(` ${q} `) || nameB.includes(` ${q}`) || nameB.includes(`${q} `) ? 1 : 0));
          
          return weightB - weightA;
        });

        sortedMovies.slice(0, 6).forEach((movie: any) => {
          const candidates = getMovieImageCandidates(movie, "poster");
          results.push({
            type: "movie",
            title: movie.name,
            subtitle: `${movie.year} • ${movie.quality}`,
            slug: movie.slug,
            image: candidates[0] || undefined,
            metadata: movie.episode_current || undefined,
          });
        });
      }

      if (categories && Array.isArray(categories)) {
        categories
          .filter((cat: any) => cat.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .slice(0, 2)
          .forEach((cat: any) => {
            results.push({ type: "category", title: cat.name, subtitle: "Thể loại", slug: cat.slug });
          });
      }

      cacheRef.current.set(searchQuery, results);
      setSuggestions(results);
    } catch (err: any) {
      if (err?.name !== "AbortError") setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [categories]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setSelectedIndex(-1);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    if (value.trim()) {
      debounceTimer.current = setTimeout(() => fetchSuggestions(value), 300);
    } else {
      setSuggestions([]);
    }
  };

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  // Handle clicking on backdrop - close search
  const handleBackdropClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  const handleSelect = useCallback((suggestion: SearchSuggestion) => {
    if (suggestion.type === "movie") {
      router.push(`/watch?slug=${suggestion.slug}`);
    } else {
      router.push(`/?category=${suggestion.slug}`);
    }
    onClose();
  }, [router, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelect(suggestions[selectedIndex]);
    } else if (query.trim()) {
      router.push(`/search?query=${encodeURIComponent(query.trim())}`);
      onClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Escape") {
      handleClose();
    }
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[99999] flex flex-col"
      style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
      onClick={handleBackdropClick}
    >
      {/* Search Container */}
      <div
        className="w-full max-w-3xl mx-auto px-3 sm:px-4 pt-[8vh] sm:pt-[12vh]"
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: "calc(100vh - 2rem)", overflow: "auto" }}
      >
        {/* Clean Search Box */}
        <div
          className="relative rounded-2xl overflow-hidden shadow-none"
          style={{
            background: "#050807",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {/* Top accent line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#f59e0b] to-transparent opacity-80" />

          {/* Input Row */}
          <form onSubmit={handleSubmit} className="flex items-center px-4 sm:px-6 py-3 sm:py-4 gap-3 sm:gap-4 border-b border-white/5">
            {/* Search Icon */}
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#f59e0b] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>

            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Bạn muốn xem phim gì hôm nay?"
              autoComplete="off"
              spellCheck={false}
              aria-label="Tìm kiếm phim"
              inputMode="search"
              className="flex-1 bg-transparent text-white text-base sm:text-xl font-medium placeholder-white/30 focus:outline-none min-w-0"
              style={{ fontSize: '16px' }}
            />

            {/* Status */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/10 border-t-[#f59e0b] rounded-full animate-spin" />
              ) : query ? (
                <button
                  type="button"
                  onClick={() => { setQuery(""); setSuggestions([]); inputRef.current?.focus(); }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setQuery(""); 
                    setSuggestions([]); 
                    inputRef.current?.focus();
                  }}
                  className="p-1 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
                  aria-label="Xóa tìm kiếm"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              ) : null}

              <kbd className="hidden sm:flex items-center justify-center px-2.5 py-1.5 rounded-lg text-xs font-bold text-white/30 bg-white/5 border border-white/10 shadow-inner">
                ESC
              </kbd>
            </div>
          </form>

          {/* Results / Trending */}
          <div className="max-h-[60vh] overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-white/10 hover:[&::-webkit-scrollbar-thumb]:bg-[#f59e0b]/50 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent pr-1">
            {suggestions.length > 0 ? (
              <ul role="listbox" aria-label="Kết quả tìm kiếm">
                {/* Section: Movies */}
                {suggestions.filter((s) => s.type === "movie").length > 0 && (
                  <>
                    <li className="px-4 sm:px-6 pt-3 sm:pt-4 pb-2">
                      <span className="text-[11px] font-black text-[#f59e0b] uppercase tracking-[0.2em]">Phim</span>
                    </li>
                    {suggestions.filter((s) => s.type === "movie").map((s, i) => (
                      <li key={`movie-${s.slug}`} role="option" aria-selected={selectedIndex === i}>
                        <button
                          onClick={() => handleSelect(s)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 sm:px-6 py-2.5 sm:py-3 transition-all duration-200 group text-left",
                            selectedIndex === i
                              ? "bg-[#f59e0b]/10 border-l-4 border-[#f59e0b]"
                              : "hover:bg-white/5 border-l-4 border-transparent"
                          )}
                        >
                          {/* Thumbnail */}
                          <div className="relative w-10 h-14 sm:w-14 sm:h-20 rounded-md overflow-hidden flex-shrink-0 bg-neutral-900 shadow-md">
                            <AutocompleteImage src={s.image} title={s.title} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <p className={cn(
                              "font-bold text-sm sm:text-base truncate transition-colors",
                              selectedIndex === i ? "text-[#f59e0b]" : "text-white group-hover:text-[#f59e0b]"
                            )}>
                              {s.title}
                            </p>
                            <p className="text-xs sm:text-sm font-medium text-white/50 mt-1">{s.subtitle}</p>
                            {s.metadata && (
                              <span className="inline-block mt-1.5 text-[10px] font-bold text-black bg-[#f59e0b] px-2 py-0.5 rounded shadow-sm">
                                {s.metadata}
                              </span>
                            )}
                          </div>

                          {/* Arrow */}
                          <svg className={cn("w-5 h-5 flex-shrink-0 transition-transform duration-300", selectedIndex === i ? "text-[#f59e0b] translate-x-1" : "text-white/10 group-hover:text-[#f59e0b] group-hover:translate-x-1")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </li>
                    ))}
                  </>
                )}

                {/* Section: Categories */}
                {suggestions.filter((s) => s.type === "category").length > 0 && (
                  <>
                    <li className="px-5 pt-3 pb-1">
                      <span className="text-[10px] font-bold text-white/25 uppercase tracking-widest">Thể Loại</span>
                    </li>
                    {suggestions.filter((s) => s.type === "category").map((s) => (
                      <li key={`cat-${s.slug}`}>
                        <button
                          onClick={() => handleSelect(s)}
                          className="w-full flex items-center gap-4 px-5 py-3 hover:bg-white/5 transition-all group text-left border-l-2 border-transparent hover:border-primary"
                        >
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-white group-hover:text-primary transition-colors">{s.title}</p>
                            <p className="text-xs text-white/40 mt-0.5">{s.subtitle}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </>
                )}
              </ul>
            ) : query.trim().length >= 2 && !isLoading ? (
              /* No results */
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-white/30 text-sm">Không tìm thấy kết quả cho <span className="text-white/50 font-semibold">"{query}"</span></p>
              </div>
            ) : null}

            {/* Footer hint */}
            {suggestions.length > 0 && (
              <div className="flex items-center gap-4 px-5 py-3 border-t border-white/5 text-white/20 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/8 border border-white/10 text-[10px]">↑↓</kbd>
                  Điều hướng
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/8 border border-white/10 text-[10px]">↵</kbd>
                  Chọn
                </span>
                <span className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/8 border border-white/10 text-[10px]">ESC</kbd>
                  Đóng
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Fulltext search hint */}
        {query.trim().length >= 2 && (
          <button
            onClick={handleSubmit}
            className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/70 transition-colors hover:bg-white/5"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Xem tất cả kết quả cho <span className="text-white/60 font-semibold ml-1">"{query}"</span>
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}

export default memo(SearchPanel);
