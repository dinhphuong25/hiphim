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
import { openVietnamCopyrightModal, isClientAdmin } from "@/lib/vietnam-copyright";
import { useUserAuth } from "@/context/user-auth-context";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
  const { user } = useUserAuth();
  const isAdmin = Boolean(user && (user.role === "admin" || user.role === "superadmin")) || isClientAdmin();

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

  // Synchronous initialization: if SSR movies or memory cache has data, load with 0 delay!
  const [movies, setMovies] = useState<any[]>(() => {
    if (initialMovies && initialMovies.length > 0) {
      const cleaned = filterHiddenMovies(initialMovies);
      instantMovieStore.set(currentKey, {
        items: cleaned,
        pagination: initialPageInfo,
      });
      return cleaned;
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

  // Direct client fetch to phimapi.com (CORS *) to completely eliminate Cloudflare Worker subrequests
  const proxyFetch = (url: string) =>
    apiCache.fetchWithCache(url, async () => {
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
        if (res.ok) return await res.json();
      } catch {}
      return null;
    }, 60000);

  const fetchMovies = async (targetKey: string, isSilent = false) => {
    if (currentCountry === "viet-nam" && !isAdmin) {
      setMovies([]);
      setLoading(false);
      setIsTransitioning(false);
      setIsRefreshing(false);
      openVietnamCopyrightModal();
      return;
    }

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
      const filtered = filterHiddenMovies(items, { isAdmin });

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
        <MovieGridSkeleton count={10} />
      </div>
    );
  }

  if (!loading && movies.length === 0) {
    if (currentCountry === "viet-nam" && !isAdmin) {
      return (
        <div className="min-h-[60vh] flex items-center justify-center pt-8 px-4">
          <div className="w-full max-w-xl text-center p-6 sm:p-9 rounded-3xl bg-[#0B120E] border border-amber-500/35 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_25px_rgba(245,158,11,0.15)] flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600/25 via-amber-500/20 to-red-600/10 border border-amber-500/40 flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(245,158,11,0.25)]">
              <ShieldAlert className="w-7 h-7 text-amber-400 stroke-[2.2]" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-[11px] font-extrabold uppercase tracking-wider text-amber-300 mb-2">
              Bản Quyền Điện Ảnh Việt Nam
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
              Không Chiếu Phim Việt Nam
            </h2>
            <p className="text-xs sm:text-sm text-white/75 leading-relaxed max-w-md mb-6">
              Nhằm tôn trọng và tuân thủ Luật Sở hữu trí tuệ, bảo vệ sự phát triển của điện ảnh nước nhà, <strong className="text-amber-300 font-semibold">Hi Phim cam kết KHÔNG phát sóng và không lưu trữ bất kỳ tác phẩm điện ảnh nào của Việt Nam</strong>. Quý khán giả vui lòng theo dõi tại rạp chiếu phim hoặc các nền tảng có bản quyền chính thức.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => openVietnamCopyrightModal()}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs sm:text-sm border border-amber-500/35 transition-colors cursor-pointer"
              >
                Xem Chi Tiết Chính Sách
              </button>
              <Link
                href="/"
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-brand-green text-black font-extrabold text-xs sm:text-sm hover:brightness-110 transition-all cursor-pointer shadow-[0_4px_16px_rgba(32,214,107,0.3)]"
              >
                Khám Phá Phim Quốc Tế
              </Link>
            </div>
          </div>
        </div>
      );
    }

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


