"use client";

import { useCallback, useEffect } from "react";
import Link from "next/link";
import { Trash2, History } from "lucide-react";
import { useWatchHistory } from "@/hooks/useLocalStorage";
import { useUserAuth } from "@/context/user-auth-context";
import AuthGate from "@/components/auth/auth-gate";
import MovieCardEditorial from "@/components/movie/movie-card-editorial";
import type { WatchHistoryItem } from "@/lib/types";

interface RecentlyWatchedClientProps {
  categories?: any[];
  countries?: any[];
}

export default function RecentlyWatchedClient({ categories, countries }: RecentlyWatchedClientProps) {
  const { user, loading: authLoading, updateServerData } = useUserAuth();
  const { history, removeFromHistory, clearHistory, batchUpdateHistory, hydrated } = useWatchHistory();
  const movies = (history && history.length > 0 ? history : (user?.history || [])) as WatchHistoryItem[];

  // Auto-enrich any items in history that miss origin_name or rating
  useEffect(() => {
    if (!hydrated || !history || history.length === 0) return;

    const itemsToEnrich = (history as WatchHistoryItem[]).filter(
      m => !m.origin_name || (!m.tmdb?.vote_average && !m.imdb?.rating)
    );
    if (itemsToEnrich.length === 0) return;

    let isMounted = true;
    Promise.all(
      itemsToEnrich.map(async (item) => {
        try {
          const res = await fetch(`/api/phim?url=${encodeURIComponent(`https://phimapi.com/phim/${item.slug}`)}`);
          if (!res.ok) return null;
          const data = await res.json();
          const m = data?.movie;
          if (!m) return null;
          return {
            slug: item.slug,
            origin_name: m.origin_name || item.origin_name,
            year: typeof m.year === "string" ? parseInt(m.year, 10) : (m.year || item.year),
            quality: m.quality || item.quality,
            episode_current: m.episode_current || item.episode_current,
            poster_url: m.poster_url || item.poster_url,
            thumb_url: m.thumb_url || item.thumb_url,
            tmdb: m.tmdb?.vote_average ? { vote_average: m.tmdb.vote_average } : item.tmdb,
            imdb: (m.imdb?.vote_average || m.imdb?.rating) ? { rating: m.imdb.vote_average || m.imdb.rating } : item.imdb,
          };
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (!isMounted) return;
      const validPatches = results.filter(Boolean) as (Partial<WatchHistoryItem> & { slug: string })[];
      if (validPatches.length > 0) {
        batchUpdateHistory(validPatches);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [hydrated, history, batchUpdateHistory]);

  const handleRemove = useCallback((slug: string) => {
    const updated = removeFromHistory(slug);
    if (user && Array.isArray(updated)) {
      updateServerData({ history: updated });
    }
  }, [removeFromHistory, user, updateServerData]);

  const handleClearAll = () => {
    clearHistory();
    if (user) {
      updateServerData({ history: [] });
    }
  };

  if (!hydrated || authLoading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-8 lg:px-12 xl:px-16 pt-20 sm:pt-24 lg:pt-28 pb-20 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-brand-green/20 border-t-brand-green animate-spin" />
      </div>
    );
  }

  // If not logged in, require authentication
  if (!user) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-8 lg:px-12 xl:px-16 pt-20 sm:pt-24 lg:pt-28 pb-20">
        <AuthGate
          title="Lịch Sử Xem Phim Cá Nhân"
          description="Lịch sử xem phim được lưu trữ và đồng bộ riêng cho tài khoản của bạn. Vui lòng đăng nhập hoặc tạo tài khoản để tiếp tục theo dõi các tập phim bạn đang xem dở."
          icon={History}
        />
      </div>
    );
  }

  return (
    <>
      <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-8 lg:px-12 xl:px-16 pt-20 sm:pt-24 lg:pt-28 pb-20">
        {/* Empty State */}
        {movies.length === 0 ? (
          <div className="py-16 sm:py-24 text-center select-none animate-in fade-in duration-200">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-5 rounded-3xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-white/40 shadow-xl">
              <History className="w-10 h-10 sm:w-12 sm:h-12 stroke-[1.8]" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2.5">
              Chưa có phim nào trong lịch sử xem
            </h3>
            <p className="text-sm sm:text-base text-white/60 max-w-md mx-auto mb-8 leading-relaxed font-normal">
              Khi bạn xem phim trên tài khoản này, danh sách các tập phim đang xem dở sẽ tự động được lưu và đồng bộ tại đây.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 h-11 px-7 rounded-xl bg-brand-green hover:bg-brand-green-hover text-cinema-bg font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(32,214,107,0.25)] transition-all active:scale-95 cursor-pointer"
            >
              <span>Khám phá phim ngay</span>
            </Link>
          </div>
        ) : (
          /* Movie Grid - Identical to standard categories */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {movies.map((movie, i) => (
              <div
                key={movie.slug}
                className="relative group/recent transform-gpu"
                style={{
                  opacity: 0,
                  animation: `fadeSlideUp 0.4s ease forwards`,
                  animationDelay: `${i * 0.04}s`,
                }}
              >
                <MovieCardEditorial
                  movie={{
                    slug: movie.slug,
                    name: movie.name,
                    origin_name: movie.origin_name,
                    thumb_url: movie.thumb_url,
                    poster_url: movie.poster_url,
                    year: typeof movie.year === "string" ? parseInt(movie.year, 10) : movie.year,
                    quality: movie.quality,
                    episode_current: movie.episodeName || movie.episode_current,
                    episodeIndex: movie.episodeIndex,
                    episodeName: movie.episodeName,
                    currentTime: movie.currentTime,
                    duration: movie.duration,
                    tmdb: movie.tmdb,
                    imdb: movie.imdb,
                  }}
                  hideFavoriteButton={true}
                />

                {/* Quick remove button on top-right on hover */}
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemove(movie.slug);
                  }}
                  className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/80 hover:bg-red-500/90 text-white/70 hover:text-white border border-white/20 hover:border-red-400 transition-all opacity-0 group-hover/recent:opacity-100 shadow-md active:scale-90 cursor-pointer"
                  title="Xóa khỏi lịch sử"
                  aria-label="Xóa khỏi lịch sử"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
