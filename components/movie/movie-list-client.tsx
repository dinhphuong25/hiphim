"use client";
import React, { useEffect, useState, useMemo, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { filterHiddenMovies } from "@/lib/hidden-movies";
import { MovieGridSkeleton } from "@/components/movie/movie-skeleton";
import dynamic from "next/dynamic";
import { apiCache } from "@/lib/api-cache";
import { instantMovieStore } from "@/lib/instant-movie-store";
import { getCategoryDisplayName } from "@/lib/categories";
import { getCountryDisplayName } from "@/lib/countries";
import { cn } from "@/lib/utils";
import { Compass, ChevronLeft } from "lucide-react";

import InfiniteMovieGrid from "@/components/movie/infinite-movie-grid";

interface MovieListClientProps {
  index?: number;
  category?: string;
  topic?: string;
  typeList?: string;
  categories?: { slug: string; name: string }[];
  countries?: { slug: string; name: string }[];
  initialMovies?: any[];
  initialPageInfo?: any;
}

// Topic name mapping
const TOPIC_NAMES: Record<string, string> = {
  "phim-bo": "Chương Trình Truyền Hình",
  "phim-le": "Phim Điện Ảnh",
  "hoat-hinh": "Phim Hoạt Hình",
  "tv-shows": "TV Shows",
  "phim-vietsub": "Phim Vietsub",
  "phim-thuyet-minh": "Phim Thuyết Minh",
  "phim-long-tieng": "Phim Lồng Tiếng",
  "phim-chieu-rap": "Phim Chiếu Rạp",
};

const MovieListClient = ({
  index = 1,
  category,
  topic,
  typeList,
  categories = [],
  countries = [],
  initialMovies = [],
  initialPageInfo = null,
}: MovieListClientProps) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Compute cache key for current filter combination
  const currentCountry = searchParams.get("country");
  const currentCategory = searchParams.get("category") || category;
  const currentYear = searchParams.get("year");
  const currentTypeList = searchParams.get("typeList") || typeList;
  const sortField = searchParams.get("sortField");
  const sortType = searchParams.get("sortType") || "desc";
  const sortLang = searchParams.get("sortLang") || "vietsub";
  const limit = searchParams.get("limit") || "20";

  const currentKey = useMemo(() => {
    return instantMovieStore.buildKey({
      typeList: currentTypeList,
      category: currentCategory,
      topic,
      country: currentCountry,
      year: currentYear,
      page: index,
      sortField,
      sortType,
    });
  }, [currentTypeList, currentCategory, topic, currentCountry, currentYear, index, sortField, sortType]);

  // Seed cache with initial SSR movies if provided
  if (initialMovies && initialMovies.length > 0) {
    instantMovieStore.set(currentKey, {
      items: initialMovies,
      pagination: initialPageInfo,
    });
  }

  // Synchronous initialization: if SSR movies or memory cache has data, load with 0 delay!
  const [movies, setMovies] = useState<any[]>(() => {
    if (initialMovies && initialMovies.length > 0) {
      return filterHiddenMovies(initialMovies);
    }
    const cached = instantMovieStore.get(currentKey);
    if (cached && cached.items.length > 0) {
      return cached.items;
    }
    return [];
  });

  const [pageInfo, setPageInfo] = useState<any>(() => {
    if (initialPageInfo) return initialPageInfo;
    const cached = instantMovieStore.get(currentKey);
    return cached?.pagination || null;
  });

  const [currentPage, setCurrentPage] = useState<number>(() => {
    return pageInfo?.currentPage || pageInfo?.page || Number(index) || 1;
  });
  const [totalPages, setTotalPages] = useState<number>(() => {
    return (
      pageInfo?.totalPages ||
      pageInfo?.total_pages ||
      (pageInfo?.totalItems ? Math.ceil(pageInfo.totalItems / (pageInfo.totalItemsPerPage || 20)) : 1)
    );
  });

  useEffect(() => {
    if (pageInfo) {
      const p = pageInfo?.currentPage || pageInfo?.page || Number(index) || 1;
      const tp =
        pageInfo?.totalPages ||
        pageInfo?.total_pages ||
        (pageInfo?.totalItems ? Math.ceil(pageInfo.totalItems / (pageInfo.totalItemsPerPage || 20)) : 1);
      setCurrentPage(p);
      setTotalPages(tp);
    }
  }, [pageInfo, index]);

  const [loading, setLoading] = useState<boolean>(() => {
    if (initialMovies && initialMovies.length > 0) return false;
    const cached = instantMovieStore.get(currentKey);
    return !cached || cached.items.length === 0;
  });

  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastKeyRef = useRef(currentKey);
  const isInitialMount = useRef(true);

  const proxyFetch = (url: string) =>
    apiCache.fetchWithCache(url, () =>
      fetch(`/api/phim?url=${encodeURIComponent(url)}`).then((r) => r.json())
    , 60000);

  const fetchMovies = async (targetKey: string, isSilent = false) => {
    if (isSilent) {
      setIsRefreshing(true);
    }

    try {
      let url: string;
      const cat = currentCategory;

      if (currentTypeList) {
        const urlObj = new URL(`https://phimapi.com/v1/api/danh-sach/${currentTypeList}`);
        urlObj.searchParams.set("page", String(index));
        urlObj.searchParams.set("sort_field", sortField || "modified.time");
        urlObj.searchParams.set("sort_type", sortType);
        urlObj.searchParams.set("limit", limit);
        if (sortLang) urlObj.searchParams.set("sort_lang", sortLang);
        if (cat) urlObj.searchParams.set("category", cat);
        if (currentCountry) urlObj.searchParams.set("country", currentCountry);
        if (currentYear) urlObj.searchParams.set("year", currentYear);
        url = urlObj.toString();
      } else if (cat) {
        url = `https://phimapi.com/v1/api/the-loai/${cat}?page=${index}&limit=${limit}`;
      } else if (currentCountry) {
        url = `https://phimapi.com/v1/api/quoc-gia/${currentCountry}?page=${index}&limit=${limit}`;
      } else if (currentYear) {
        url = `https://phimapi.com/v1/api/nam-phat-hanh/${currentYear}?page=${index}&limit=${limit}`;
      } else if (topic) {
        url = `https://phimapi.com/v1/api/danh-sach/${topic}?page=${index}&limit=${limit}`;
      } else {
        url = `https://phimapi.com/v1/api/danh-sach/phim-moi-cap-nhat?page=${index}&limit=${limit}`;
      }

      const data = await proxyFetch(url);

      const items = data?.data?.items || data?.items || [];
      const pagination = data?.data?.params?.pagination || data?.pagination || null;
      const filtered = filterHiddenMovies(items);

      // Save to instant memory store
      instantMovieStore.set(targetKey, { items: filtered, pagination });

      // Only update if user hasn't switched to another filter in the meantime
      if (lastKeyRef.current === targetKey) {
        setMovies(filtered);
        setPageInfo(pagination);
      }
    } catch (error) {
      console.error("Failed to fetch movies:", error);
    } finally {
      setLoading(false);
      setIsTransitioning(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Skip duplicate background fetch on initial SSR mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      if (initialMovies && initialMovies.length > 0) {
        return;
      }
    }

    lastKeyRef.current = currentKey;

    // Check instant cache first: INSTANT ZERO-LATENCY TAB SWITCHING
    const cached = instantMovieStore.get(currentKey);
    if (cached && cached.items.length > 0) {
      setMovies(cached.items);
      setPageInfo(cached.pagination);
      setLoading(false);
      setIsTransitioning(false);
      return;
    }

    // Not in cache: if we have existing movies, keep them visible and show subtle indicator
    if (movies.length > 0) {
      setIsTransitioning(true);
      fetchMovies(currentKey, false);
    } else {
      setLoading(true);
      fetchMovies(currentKey, false);
    }
  }, [currentKey, index]);

  const getPageTitle = () => {
    const catName = getCategoryDisplayName(currentCategory, categories);
    const countryName = getCountryDisplayName(currentCountry, countries);

    const parts: string[] = [];
    if (currentTypeList) parts.push(TOPIC_NAMES[currentTypeList] || "Kết quả lọc");
    else if (topic) parts.push(TOPIC_NAMES[topic] || topic);
    else if (catName) parts.push(catName);

    if (countryName) parts.push(countryName);
    if (currentYear) parts.push(`Năm ${currentYear}`);

    if (parts.length > 0) return parts.join(" - ");
    return "Danh Sách Phim";
  };

  // Only show skeleton on first cold uncached load when 0 movies exist
  if (loading && movies.length === 0) {
    return (
      <div className="pt-2 sm:pt-4 px-1 sm:px-0 animate-in fade-in duration-200">
        {/* Status Title Row during skeleton load */}
        <div className="flex items-center justify-between px-2 sm:px-3 py-2.5 mb-3 sm:mb-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
          <div className="flex items-center gap-2 min-w-0">
            <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green stroke-[2.4] shrink-0" />
            <span className="text-xs sm:text-base text-white/55 font-semibold truncate">
              Khám phá:{" "}
              <span className="text-white font-black text-sm sm:text-lg">
                {getPageTitle()}
              </span>
            </span>
          </div>
        </div>
        <MovieGridSkeleton count={10} />
      </div>
    );
  }

  if (!loading && movies.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center pt-8">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white">Không tìm thấy phim</h3>
          <p className="text-gray-400">Vui lòng thử lại với các tùy chọn khác.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-2 sm:pt-4 px-1 sm:px-0 relative">
      {/* Sleek emerald top progress bar during background transitions */}
      {isTransitioning && (
        <div className="fixed top-0 left-0 right-0 h-[2.5px] bg-brand-green shadow-[0_0_12px_rgba(34,197,94,0.9)] z-[200] animate-pulse pointer-events-none" />
      )}

      {/* Hidden for accessibility & SEO */}
      <h1 className="sr-only">{getPageTitle()}</h1>

      {/* Result Status Title Row matching native app explore.tsx & Screenshot 2 */}
      <div className="flex items-center justify-between px-2 sm:px-3 py-2.5 sm:py-3 mb-3 sm:mb-4 bg-white/[0.02] rounded-xl border border-white/[0.06]">
        <div className="flex items-center gap-2 min-w-0">
          <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-brand-green stroke-[2.4] shrink-0" />
          <span className="text-xs sm:text-base text-white/55 font-semibold truncate">
            Khám phá:{" "}
            <span className="text-white font-black text-sm sm:text-lg">
              {getPageTitle()}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                router.back();
              } else {
                router.push("/");
              }
            }}
            className="hidden sm:inline-flex lg:hidden items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-xs font-bold text-white/80 hover:text-white transition-all active:scale-95 cursor-pointer"
            aria-label="Về trang chủ"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-brand-green stroke-[2.5]" />
            <span>Về trang chủ</span>
          </button>
          {totalPages > 1 && (
            <div className="px-2.5 py-1 sm:py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-[11px] sm:text-xs font-bold text-white/70">
              Trang {currentPage}/{totalPages}
            </div>
          )}
        </div>
      </div>

      {/* Infinite scroll grid with smooth fade transitions */}
      <div className={cn("transition-opacity duration-200", isTransitioning ? "opacity-80" : "opacity-100")}>
        <InfiniteMovieGrid
          key={currentKey}
          initialMovies={movies}
          topic={topic}
          category={currentCategory}
          onPageChange={(p, tp) => {
            setCurrentPage(p);
            setTotalPages(tp);
          }}
        />
      </div>
    </div>
  );
};

export default React.memo(MovieListClient);


