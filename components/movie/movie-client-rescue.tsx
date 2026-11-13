"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Film, Home, RefreshCw, Search, ArrowLeft } from "lucide-react";
import { LoadingWatch } from "@/components/ui/page-loaders";
import { getMovieReferrer } from "@/lib/navigation-history";
import { isSlugHidden } from "@/lib/hidden-movies";
import {
  fetchMovieClientSide,
  fetchPrimaryPhimApiClient,
  hasAnyM3u8Stream,
  injectM3u8IntoServers,
  type RescuedMovieData,
} from "@/lib/movie-rescue-client";

export {
  fetchMovieClientSide,
  fetchPrimaryPhimApiClient,
  hasAnyM3u8Stream,
  injectM3u8IntoServers,
  type RescuedMovieData,
};

const DynamicMovieDetailView = dynamic(
  () => import("@/components/movie/movie-detail-view"),
  { ssr: false }
);

const DynamicDescription = dynamic(
  () => import("@/components/movie/description"),
  {
    ssr: false,
    loading: () => <LoadingWatch />,
  }
);

export function TrueNotFoundCard({ onRetry }: { onRetry?: () => void }) {
  const router = useRouter();

  return (
    <div className="min-h-[82vh] w-full flex items-center justify-center bg-[#060908] overflow-hidden relative px-4 pt-8 pb-36 select-none">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-brand-green/10 rounded-full blur-[110px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center text-center max-w-md mx-auto">
        <div className="relative w-20 h-20 mb-5">
          <div className="absolute inset-0 bg-brand-green/20 rounded-full blur-xl animate-pulse" />
          <div className="relative w-full h-full bg-[#0e1512] border border-brand-green/30 rounded-full flex items-center justify-center shadow-2xl">
            <Film className="w-9 h-9 text-brand-green" strokeWidth={1.6} />
          </div>
        </div>

        <h1 className="text-7xl sm:text-8xl font-black leading-none tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white/85 to-white/20 mb-3">
          404
        </h1>

        <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-2.5 tracking-tight">
          Lạc lối giữa rạp phim
        </h2>
        <p className="text-white/60 text-sm sm:text-base mb-7 leading-relaxed">
          Cuốn phim bạn đang tìm kiếm không tồn tại hoặc đã được gỡ bỏ khỏi hệ thống.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-green hover:bg-[#1bc25f] text-cinema-bg font-extrabold text-sm px-6 py-3 rounded-full shadow-[0_0_25px_rgba(32,214,107,0.4)] transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Thử Tải Lại Phim</span>
            </button>
          )}

          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-brand-green hover:bg-[#1bc25f] text-cinema-bg font-extrabold text-sm px-7 py-3 rounded-full shadow-[0_0_25px_rgba(32,214,107,0.35)] transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Về Trang Chủ</span>
          </Link>

          <Link
            href="/search"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white/[0.06] hover:bg-white/[0.12] text-white border border-white/15 font-bold text-sm px-7 py-3 rounded-full transition-all active:scale-95"
          >
            <Search className="w-4 h-4" />
            <span>Tìm Phim Mới</span>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => router.push(getMovieReferrer())}
          className="mt-7 inline-flex items-center gap-2 text-xs font-semibold text-white/50 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại trang trước</span>
        </button>
      </div>
    </div>
  );
}

function MovieDetailClientRescueContent({ slug }: { slug: string }) {
  const [data, setData] = useState<RescuedMovieData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMovie = useCallback(async () => {
    setLoading(true);
    const res = await fetchMovieClientSide(slug);
    setData(res);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    let active = true;
    fetchMovieClientSide(slug).then((res) => {
      if (active) {
        setData(res);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-[80vh] w-full flex flex-col items-center justify-center gap-3 bg-cinema-bg text-white px-4">
        <div className="w-11 h-11 rounded-full border-2 border-brand-green/30 border-t-brand-green animate-spin" />
        <p className="text-xs font-mono text-white/60">Đang kết nối máy chủ phim...</p>
      </div>
    );
  }

  if (!data?.movie) {
    return <TrueNotFoundCard onRetry={loadMovie} />;
  }

  return <DynamicMovieDetailView movie={data.movie} episodes={data.episodes} />;
}

export function MovieDetailClientRescue({ slug }: { slug: string }) {
  if (isSlugHidden(slug)) {
    return <TrueNotFoundCard />;
  }
  return <MovieDetailClientRescueContent slug={slug} />;
}

function WatchClientRescueContent({ slug }: { slug: string }) {
  const [data, setData] = useState<RescuedMovieData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMovie = useCallback(async () => {
    setLoading(true);
    const res = await fetchMovieClientSide(slug);
    setData(res);
    setLoading(false);
  }, [slug]);

  useEffect(() => {
    let active = true;
    fetchMovieClientSide(slug).then((res) => {
      if (active) {
        setData(res);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return <LoadingWatch />;
  }

  if (!data?.movie) {
    return <TrueNotFoundCard onRetry={loadMovie} />;
  }

  return (
    <div className="min-h-screen bg-cinema-bg text-white selection:bg-brand-green selection:text-cinema-bg">
      <main className="relative z-10 min-h-0 sm:min-h-screen flex flex-col w-full">
        <div className="w-full max-w-[1920px] mx-auto pb-3 sm:pb-16 px-3 sm:px-6 lg:px-8 xl:px-10 flex flex-col">
          <DynamicDescription
            movie={data.movie}
            serverData={data.episodes}
            slug={slug}
            thumb_url={data.movie.thumb_url}
          />
        </div>
      </main>
    </div>
  );
}

export function WatchClientRescue({ slug }: { slug: string }) {
  if (isSlugHidden(slug)) {
    return <TrueNotFoundCard />;
  }
  return <WatchClientRescueContent slug={slug} />;
}
