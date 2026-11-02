"use client";

import { useCallback, useEffect, useRef } from "react";
import { useFavorites, getFavoriteMovies } from "@/hooks/useLocalStorage";
import { useUserAuth } from "@/context/user-auth-context";
import AuthGate from "@/components/auth/auth-gate";
import { Trash2, Heart } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import MovieCardEditorial from "@/components/movie/movie-card-editorial";
import type { FavoriteItem } from "@/lib/types";

interface FavoritesClientProps {
  categories?: any[];
  countries?: any[];
}

export default function FavoritesClient({}: FavoritesClientProps) {
  const { user, loading: authLoading, updateServerData } = useUserAuth();
  const { favorites, removeFavorite, clearFavorites, batchUpdateFavorites, hydrated } = useFavorites();
  const enrichedSlugsRef = useRef<Set<string>>(new Set());

  const movies: FavoriteItem[] = hydrated
    ? favorites
    : ((user?.favorites || []) as FavoriteItem[]);

  // Auto-enrich any items in favorites that miss origin_name or poster/thumb (once per slug, no infinite loop)
  useEffect(() => {
    if (!hydrated || !favorites || favorites.length === 0) return;

    const itemsToEnrich = favorites.filter(
      (m) =>
        m.slug &&
        !enrichedSlugsRef.current.has(m.slug) &&
        (!m.origin_name || !m.thumb_url || (!m.tmdb?.vote_average && !m.imdb?.rating))
    );
    if (itemsToEnrich.length === 0) return;

    itemsToEnrich.forEach((m) => enrichedSlugsRef.current.add(m.slug));

    let isMounted = true;
    Promise.all(
      itemsToEnrich.map(async (item) => {
        try {
          const res = await fetch(`https://phimapi.com/phim/${encodeURIComponent(item.slug)}`);
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
            imdb:
              m.imdb?.vote_average || m.imdb?.rating
                ? { rating: m.imdb.vote_average || m.imdb.rating }
                : item.imdb,
          };
        } catch {
          return null;
        }
      })
    ).then((results) => {
      if (!isMounted) return;
      const validPatches = results.filter(Boolean) as (Partial<FavoriteItem> & { slug: string })[];
      if (validPatches.length > 0) {
        batchUpdateFavorites(validPatches);
        if (user) {
          const latestFavs = getFavoriteMovies();
          if (latestFavs.length > 0) {
            updateServerData({ favorites: latestFavs });
          }
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [hydrated, favorites, batchUpdateFavorites, user, updateServerData]);

  const handleRemove = useCallback(
    (slug: string, name?: string) => {
      const updated = removeFavorite(slug);
      if (user && Array.isArray(updated)) {
        updateServerData({ favorites: updated });
      }
      toast.info(name ? `Đã xóa "${name}" khỏi danh sách yêu thích` : "Đã xóa khỏi danh sách yêu thích");
    },
    [removeFavorite, user, updateServerData]
  );

  const handleClearAll = useCallback(() => {
    clearFavorites();
    if (user) {
      updateServerData({ favorites: [] });
    }
    toast.success("Đã xóa toàn bộ danh sách yêu thích");
  }, [clearFavorites, user, updateServerData]);

  if (!hydrated || authLoading) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-8 lg:px-12 xl:px-16 pt-20 sm:pt-24 lg:pt-28 pb-20 flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 rounded-full border-2 border-brand-green/20 border-t-brand-green animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="w-full max-w-[1600px] mx-auto px-3.5 sm:px-8 lg:px-12 xl:px-16 pt-20 sm:pt-24 lg:pt-28 pb-20">
        <AuthGate
          title="Tủ Phim Yêu Thích Của Bạn"
          description="Tủ phim yêu thích được liên kết và đồng bộ an toàn với tài khoản cá nhân. Vui lòng đăng nhập hoặc tạo tài khoản để xem và quản lý danh sách của bạn trên mọi thiết bị."
          icon={Heart}
        />
      </div>
    );
  }

  return (
    <div className="w-full px-3.5 sm:px-6 lg:px-6 xl:px-8 pt-6 sm:pt-8 pb-20">
      {/* Header Bar */}
      {movies.length > 0 && (
        <div className="flex items-center justify-between gap-4 mb-5 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-green/15 border border-brand-green/30 flex items-center justify-center text-brand-green">
              <Heart className="w-4 h-4 fill-brand-green/30" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Phim Yêu Thích</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white/[0.06] text-brand-green border border-white/10">
                  {movies.length} phim
                </span>
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-red-500/15 text-white/60 hover:text-red-400 border border-white/10 hover:border-red-500/30 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xóa tất cả</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {movies.length === 0 ? (
        <div className="py-16 sm:py-24 text-center select-none animate-in fade-in duration-200">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-5 rounded-3xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-brand-green/50 shadow-xl">
            <Heart className="w-10 h-10 sm:w-12 sm:h-12 stroke-[1.8]" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-2.5">
            Chưa có phim nào trong danh sách yêu thích
          </h3>
          <p className="text-sm sm:text-base text-white/60 max-w-md mx-auto mb-8 leading-relaxed font-normal">
            Bấm vào biểu tượng trái tim trên bất kỳ bộ phim nào để lưu lại và xem lại bất cứ lúc nào trên mọi thiết bị.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 h-11 px-7 rounded-xl bg-brand-green hover:bg-brand-green-hover text-cinema-bg font-bold text-sm tracking-wide shadow-[0_0_20px_rgba(32,214,107,0.25)] transition-all active:scale-95 cursor-pointer"
          >
            <span>Khám phá phim ngay</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3.5 sm:gap-4 lg:gap-5">
          {movies.map((movie: FavoriteItem, i: number) => (
            <div
              key={movie.slug}
              className="relative group/fav transform-gpu"
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
                  episode_current: movie.episode_current,
                  tmdb: movie.tmdb,
                  imdb: movie.imdb,
                }}
                hideFavoriteButton={true}
              />

              {/* Quick remove button on top-right */}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemove(movie.slug, movie.name);
                }}
                className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-full bg-black/80 hover:bg-red-500/90 text-white/75 hover:text-white border border-white/20 hover:border-red-400 transition-all opacity-90 sm:opacity-0 sm:group-hover/fav:opacity-100 shadow-md active:scale-90 cursor-pointer"
                title="Xóa khỏi yêu thích"
                aria-label="Xóa khỏi yêu thích"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
}
