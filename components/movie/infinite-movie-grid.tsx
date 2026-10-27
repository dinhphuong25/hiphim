"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { filterHiddenMovies } from "@/lib/hidden-movies";
import MovieCardEditorial from "@/components/movie/movie-card-editorial";
import { Loader2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { apiCache } from "@/lib/api-cache";

interface InfiniteMovieGridProps {
  topic?: string;
  category?: string;
  initialMovies?: any[];
  onPageChange?: (page: number, totalPages: number) => void;
}

const PAGE_SIZE = 20;

export default function InfiniteMovieGrid({
  topic,
  category,
  initialMovies = [],
  onPageChange,
}: InfiniteMovieGridProps) {
  const searchParams = useSearchParams();
  const [movies, setMovies] = useState<any[]>(filterHiddenMovies(initialMovies));
  const [page, setPage] = useState(2); // page 1 already in initialMovies
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const loaderRef = useRef<HTMLDivElement>(null);

  const buildUrl = useCallback(
    (pageNum: number): string => {
      const filterCountry = searchParams.get("country");
      const filterCategory = searchParams.get("category") || category;
      const filterYear = searchParams.get("year");
      const typeList = searchParams.get("typeList") || topic;
      const sortField = searchParams.get("sortField") || "modified.time";
      const sortType = searchParams.get("sortType") || "desc";
      const limit = PAGE_SIZE;

      if (typeList) {
        const u = new URL(`https://phimapi.com/v1/api/danh-sach/${typeList}`);
        u.searchParams.set("page", String(pageNum));
        u.searchParams.set("sort_field", sortField);
        u.searchParams.set("sort_type", sortType);
        u.searchParams.set("limit", String(limit));
        if (filterCategory) u.searchParams.set("category", filterCategory);
        if (filterCountry) u.searchParams.set("country", filterCountry);
        if (filterYear) u.searchParams.set("year", filterYear);
        return `/api/phim?url=${encodeURIComponent(u.toString())}`;
      }
      if (filterCountry) {
        return `/api/phim?url=${encodeURIComponent(
          `https://phimapi.com/v1/api/quoc-gia/${filterCountry}?page=${pageNum}&limit=${limit}`
        )}`;
      }
      if (filterCategory) {
        return `/api/phim?url=${encodeURIComponent(
          `https://phimapi.com/v1/api/the-loai/${filterCategory}?page=${pageNum}&limit=${limit}`
        )}`;
      }
      if (filterYear) {
        return `/api/phim?url=${encodeURIComponent(
          `https://phimapi.com/v1/api/nam-phat-hanh/${filterYear}?page=${pageNum}&limit=${limit}`
        )}`;
      }
      return `/api/phim?url=${encodeURIComponent(
        `https://phimapi.com/danh-sach/phim-moi-cap-nhat?page=${pageNum}`
      )}`;
    },
    [searchParams, topic, category]
  );

  const fetchMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const url = buildUrl(page);
      const data = await apiCache.fetchWithCache(url, async () => {
        const res = await fetch(url);
        return res.json();
      }, 60000);

      const items =
        data.data?.items || data.items || [];
      const filtered = filterHiddenMovies(items);
      const totalPages =
        data.data?.params?.pagination?.totalPages ||
        data.pagination?.totalPages ||
        1;

      if (filtered.length === 0 || page >= totalPages) {
        setHasMore(false);
      } else {
        setMovies((prev) => {
          const slugs = new Set(prev.map((m) => m.slug));
          return [...prev, ...filtered.filter((m) => !slugs.has(m.slug))];
        });
        onPageChange?.(page, totalPages);
        setPage((p) => p + 1);
      }
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, buildUrl, onPageChange]);

  // Intersection Observer — auto-load when reaching bottom
  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) fetchMore();
      },
      { rootMargin: "300px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchMore]);

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
        {movies.map((movie, idx) => (
          <div key={movie.slug || movie._id || idx}>
            <MovieCardEditorial movie={movie} />
          </div>
        ))}
      </div>

      {/* Sentinel / Loader */}
      <div ref={loaderRef} className="flex justify-center py-8">
        {loading && (
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span>Đang tải thêm phim...</span>
          </div>
        )}
        {!hasMore && movies.length > 0 && (
          <p className="text-white/30 text-xs py-2">— Đã hiển thị tất cả —</p>
        )}
      </div>
    </div>
  );
}
