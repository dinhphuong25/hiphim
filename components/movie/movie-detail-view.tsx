"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  Heart,
  Share2,
  ChevronLeft,
  Tv,
  Info,
  Calendar,
  Clock,
  Languages,
  Film,
  Globe,
  Layers,
  Clapperboard,
  Users,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFavorites } from "@/hooks/useLocalStorage";
import { useUserAuth } from "@/context/user-auth-context";
import { getMovieImageCandidates, STATIC_BLUR_DATA_URL } from "@/lib/image-helper";

interface EpisodeItem {
  name: string;
  slug: string;
  filename?: string;
  link_embed?: string;
  link_m3u8?: string;
}

interface ServerItem {
  server_name: string;
  server_data: EpisodeItem[];
}

export interface MovieDetailViewProps {
  movie: {
    _id?: string;
    slug: string;
    name: string;
    origin_name?: string;
    content?: string;
    thumb_url?: string;
    poster_url?: string;
    year?: number | string;
    quality?: string;
    lang?: string;
    episode_current?: string;
    episode_total?: string;
    time?: string;
    actor?: string[];
    director?: string[];
    category?: Array<{ name: string; slug: string }>;
    country?: Array<{ name: string; slug: string }>;
    trailer_url?: string;
    tmdb?: { vote_average?: number };
    imdb?: { rating?: number };
  };
  episodes: ServerItem[];
}

export default function MovieDetailView({ movie, episodes = [] }: MovieDetailViewProps) {
  const router = useRouter();
  const { user, checkAuthOrPrompt, updateServerData } = useUserAuth();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [selectedServerIdx, setSelectedServerIdx] = useState(0);
  const [expandedContent, setExpandedContent] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const isFav = isFavorite(movie.slug);

  // Poster & Backdrop image candidates
  const posterCandidates = getMovieImageCandidates(movie, "poster");
  const backdropCandidates = getMovieImageCandidates(movie, "backdrop");
  const heroImage = backdropCandidates[0] || posterCandidates[0] || movie.poster_url || movie.thumb_url || "/placeholder.svg";

  // Clean HTML from synopsis
  const cleanContent = movie.content
    ? movie.content
        .replace(/<[^>]*>/g, "")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&#39;/g, "'")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ")
        .trim()
    : "";

  // Server & episodes
  const currentServer = episodes[selectedServerIdx] || episodes[0];
  const episodeList = currentServer?.server_data || [];
  const firstEpisodeSlug = episodeList[0]?.slug || "tap-01";

  // Actors & Directors
  const actorsList = (movie.actor || [])
    .flatMap((a) => (typeof a === "string" ? a.split(",") : []))
    .map((a) => a.trim())
    .filter((a) => a.length > 0 && a.toLowerCase() !== "đang cập nhật");

  const directorsList = (movie.director || [])
    .flatMap((d) => (typeof d === "string" ? d.split(",") : []))
    .map((d) => d.trim())
    .filter((d) => d.length > 0 && d.toLowerCase() !== "đang cập nhật");

  const categories = movie.category || [];
  const countries = movie.country || [];

  // Toggle favorite (requires authentication)
  const handleToggleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!checkAuthOrPrompt("lưu phim yêu thích")) return;

    const willBeFav = !isFav;
    const updated = toggleFavorite({
      slug: movie.slug,
      name: movie.name,
      origin_name: movie.origin_name,
      thumb_url: heroImage,
      poster_url: movie.poster_url,
      year: typeof movie.year === "string" ? parseInt(movie.year, 10) : movie.year,
      quality: movie.quality,
      episode_current: movie.episode_current,
      tmdb: movie.tmdb,
      imdb: movie.imdb,
    });

    if (user && updated) {
      updateServerData({ favorites: updated });
    }

    if (willBeFav) {
      toast.success(`Đã thêm "${movie.name}" vào danh sách yêu thích!`);
    } else {
      toast.info(`Đã xóa khỏi danh sách yêu thích`);
    }
  };

  // Share action (Web Share API on mobile + Clipboard copy fallback with toast)
  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = typeof window !== "undefined" ? window.location.href : `https://hiphim.one/phim/${movie.slug}`;

    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: movie.name,
          text: `Xem phim ${movie.name} (${movie.origin_name || ""}) trên Hi Phim`,
          url,
        });
        return;
      } catch (err: any) {
        if (err?.name === "AbortError") {
          return; // Người dùng chủ động huỷ chia sẻ, không cần copy
        }
      }
    }

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(url);
      } else if (typeof document !== "undefined") {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setShareCopied(true);
      toast.success("Đã sao chép liên kết phim vào bộ nhớ tạm!");
      setTimeout(() => setShareCopied(false), 2500);
    } catch {
      toast.error("Không thể sao chép liên kết.");
    }
  };

  // Back action: check internal history stack, else safely navigate to home
  const handleBack = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (typeof window !== "undefined") {
      const historyIdx = window.history.state?.idx;
      const hasInternalHistory = typeof historyIdx === "number" && historyIdx > 0;
      const hasInternalReferrer = Boolean(
        document.referrer && document.referrer.includes(window.location.host)
      );

      if (hasInternalHistory || hasInternalReferrer) {
        router.back();
      } else {
        router.push("/");
      }
    }
  };

  // Format episode label
  const formatEpName = (name: string) => {
    if (!name) return "Tập 1";
    const clean = name.trim();
    if (clean.toLowerCase().startsWith("tập")) return clean;
    return `Tập ${clean.padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#050807] text-white pb-20 sm:pb-24 lg:pb-12 selection:bg-brand-green selection:text-black">
      {/* ======================================================== */}
      {/* 1. HERO BACKDROP BANNER WITH TOP & BOTTOM GRADIENT       */}
      {/* ======================================================== */}
      <div className="relative w-full h-[210px] xs:h-[230px] sm:h-[260px] md:h-[290px] lg:h-[310px] overflow-hidden bg-[#0A0F0D]">
        {/* Backdrop Image */}
        <Image
          src={heroImage}
          alt={movie.name}
          fill
          priority
          placeholder="blur"
          blurDataURL={STATIC_BLUR_DATA_URL}
          sizes="(max-width: 768px) 100vw, 1600px"
          className="object-cover object-[center_20%] sm:object-center transform scale-102"
        />

        {/* Top Gradient for Status Bar & Header Visibility */}
        <div className="absolute inset-x-0 top-0 h-16 sm:h-20 bg-gradient-to-b from-black/80 via-black/30 to-transparent pointer-events-none" />

        {/* Bottom Cinema Fade into Page Background */}
        <div className="absolute inset-x-0 bottom-0 h-28 sm:h-36 bg-gradient-to-t from-[#050807] via-[#050807]/80 to-transparent pointer-events-none" />

        {/* Ambient Radial Vignette */}
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-black/20 to-black/60 pointer-events-none" />

        {/* ====================================================== */}
        {/* FLOATING TOP ACTION BAR (NATIVE APP STYLE)             */}
        {/* ====================================================== */}
        <div className="absolute top-[max(0.65rem,env(safe-area-inset-top))] sm:top-4 inset-x-0 px-3.5 sm:px-6 md:px-8 max-w-5xl mx-auto flex items-center justify-between z-30 pointer-events-auto">
          {/* Back Button */}
          <button
            type="button"
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/85 active:scale-90 backdrop-blur-md border border-white/20 flex items-center justify-center text-white transition-all cursor-pointer shadow-lg hover:border-brand-green/40 hover:text-brand-green select-none touch-manipulation"
            aria-label="Quay lại"
            title="Quay lại"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2.6]" />
          </button>

          {/* Right Cluster: Share & Favorite */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Share Button */}
            <button
              type="button"
              onClick={handleShare}
              className={cn(
                "w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90 select-none touch-manipulation",
                shareCopied
                  ? "bg-brand-green/20 border-brand-green/50 text-brand-green shadow-[0_0_15px_rgba(32,214,107,0.3)]"
                  : "bg-black/60 hover:bg-black/85 border-white/20 text-white hover:border-brand-green/40 hover:text-brand-green"
              )}
              aria-label="Chia sẻ phim"
              title="Chia sẻ phim"
            >
              {shareCopied ? (
                <Check className="w-4.5 h-4.5 text-brand-green stroke-[3]" />
              ) : (
                <Share2 className="w-4.5 h-4.5 stroke-[2.2]" />
              )}
            </button>

            {/* Favorite Button */}
            <button
              type="button"
              onClick={handleToggleFav}
              className={cn(
                "w-10 h-10 rounded-full backdrop-blur-md border flex items-center justify-center transition-all cursor-pointer shadow-lg active:scale-90 select-none touch-manipulation",
                isFav
                  ? "bg-rose-500/20 border-rose-500/50 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.35)]"
                  : "bg-black/60 hover:bg-black/85 border-white/20 text-white hover:border-rose-400/50 hover:text-rose-400"
              )}
              aria-label={isFav ? "Bỏ yêu thích" : "Yêu thích"}
              title={isFav ? "Bỏ yêu thích" : "Lưu vào yêu thích"}
            >
              <Heart
                className={cn(
                  "w-5 h-5 stroke-[2.2] transition-colors",
                  isFav ? "fill-rose-500 text-rose-500" : "text-white"
                )}
              />
            </button>
          </div>
        </div>

        {/* ====================================================== */}
        {/* BANNER META INFO (OVERLAID AT BOTTOM OF HERO BANNER)   */}
        {/* ====================================================== */}
        <div className="absolute inset-x-0 bottom-2 sm:bottom-3 px-3.5 sm:px-6 md:px-8 max-w-5xl mx-auto z-20 space-y-1 sm:space-y-1.5 pointer-events-auto">
          {/* Badges Row: Quality, Lang, Year, Time */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            {movie.quality && (
              <span className="px-1.5 py-0.5 rounded text-[9.5px] xs:text-[10px] sm:text-xs font-mono font-bold uppercase bg-brand-green/20 text-brand-green border border-brand-green/40 shadow-[0_0_10px_rgba(32,214,107,0.2)]">
                {movie.quality}
              </span>
            )}
            {movie.lang && (
              <span className="px-1.5 py-0.5 rounded text-[9.5px] xs:text-[10px] sm:text-xs font-mono font-bold uppercase bg-emerald-950/80 text-brand-green border border-brand-green/30">
                {movie.lang}
              </span>
            )}
            {movie.year && (
              <span className="px-1.5 py-0.5 rounded text-[9.5px] xs:text-[10px] sm:text-xs font-semibold bg-white/10 text-white/90 border border-white/10">
                {movie.year}
              </span>
            )}
            {movie.time && (
              <span className="px-1.5 py-0.5 rounded text-[9.5px] xs:text-[10px] sm:text-xs font-semibold bg-white/10 text-white/90 border border-white/10">
                {movie.time}
              </span>
            )}
          </div>

          {/* Movie Name */}
          <h1 className="text-base xs:text-lg sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight uppercase leading-snug drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] line-clamp-1 xs:line-clamp-2">
            {movie.name}
          </h1>

          {/* Movie Origin Name */}
          {movie.origin_name && (
            <p className="text-[11px] sm:text-xs text-white/60 italic font-medium drop-shadow-md line-clamp-1">
              {movie.origin_name}
            </p>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. BODY CONTENT CONTAINER                                */}
      {/* ======================================================== */}
      <div className="max-w-5xl mx-auto px-3.5 sm:px-6 md:px-8 space-y-3 sm:space-y-4 pt-2 sm:pt-2.5">
        {/* ====================================================== */}
        {/* PRIMARY CTA: XEM PHIM NGAY                             */}
        {/* ====================================================== */}
        <div>
          <Link
            href={`/watch?slug=${movie.slug}&ep=${firstEpisodeSlug}&server=${selectedServerIdx}`}
            className="w-full py-2.5 sm:py-3.5 px-4 sm:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#20D66B] to-[#10B981] hover:brightness-110 active:scale-[0.98] text-[#050807] font-black text-xs sm:text-base flex items-center justify-center gap-2 shadow-[0_0_24px_rgba(32,214,107,0.4)] transition-all cursor-pointer uppercase tracking-wide"
          >
            <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current text-[#050807]" />
            <span>
              XEM PHIM {movie.episode_current ? `(${movie.episode_current})` : ""}
            </span>
          </Link>
        </div>

        {/* ====================================================== */}
        {/* 3. NỘI DUNG PHIM (SYNOPSIS)                            */}
        {/* ====================================================== */}
        {cleanContent && (
          <section className="space-y-1.5 sm:space-y-2 pt-1 border-t border-white/[0.08]">
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
              Nội Dung Phim
            </h2>
            <p
              className={cn(
                "text-xs sm:text-[13.5px] text-white/75 leading-relaxed text-justify transition-all duration-200",
                !expandedContent && "line-clamp-3 sm:line-clamp-4"
              )}
            >
              {cleanContent}
            </p>
            {cleanContent.length > 180 && (
              <button
                type="button"
                onClick={() => setExpandedContent((prev) => !prev)}
                className="text-xs font-bold text-brand-green hover:text-emerald-400 cursor-pointer pt-0.5 inline-block"
              >
                {expandedContent ? "Thu gọn ▴" : "Xem thêm ▾"}
              </button>
            )}
          </section>
        )}

        {/* ====================================================== */}
        {/* 4. DANH SÁCH TẬP (EPISODES LIST)                       */}
        {/* ====================================================== */}
        {episodes.length > 0 && episodeList.length > 0 && (
          <section className="space-y-3 pt-3 border-t border-white/[0.08]">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <Tv className="w-4 h-4 text-brand-green stroke-[2.4]" />
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
                  Danh Sách Tập ({episodeList.length})
                </h2>
              </div>

              {/* Multi-server switcher pills if > 1 server */}
              {episodes.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                  {episodes.map((srv, idx) => (
                    <button
                      key={srv.server_name || idx}
                      type="button"
                      onClick={() => setSelectedServerIdx(idx)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer active:scale-95",
                        selectedServerIdx === idx
                          ? "bg-brand-green/20 text-brand-green border border-brand-green/40 shadow-sm"
                          : "bg-white/[0.04] text-white/60 hover:text-white border border-white/10"
                      )}
                    >
                      {srv.server_name || `Server ${idx + 1}`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Episode Grid (5 columns on mobile, expanding on desktop) */}
            <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2 sm:gap-2.5">
              {episodeList.map((ep, idx) => (
                <Link
                  key={ep.slug || idx}
                  href={`/watch?slug=${movie.slug}&ep=${ep.slug || idx + 1}&server=${selectedServerIdx}`}
                  className="py-2.5 sm:py-3 px-1 rounded-xl bg-white/[0.04] hover:bg-brand-green/15 hover:border-brand-green/40 hover:text-brand-green active:scale-95 border border-white/10 text-white/90 text-xs sm:text-[13px] font-bold text-center transition-all flex items-center justify-center truncate group shadow-xs"
                >
                  <span className="truncate group-hover:scale-105 transition-transform">
                    {formatEpName(ep.name)}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ====================================================== */}
        {/* 5. THÔNG TIN CHI TIẾT (SPECS & ACTORS)                 */}
        {/* ====================================================== */}
        <section className="space-y-3 pt-3 border-t border-white/[0.08]">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-brand-green stroke-[2.4]" />
            <h2 className="text-sm sm:text-base font-bold text-white tracking-wide">
              Thông Tin Chi Tiết
            </h2>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 sm:p-5 space-y-4">
            {/* 4-Item Quick Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pb-3 border-b border-white/[0.08]">
              {/* Năm */}
              <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                <Calendar className="w-4 h-4 text-brand-green/80 mb-1" />
                <span className="text-[10px] text-white/45 uppercase font-bold tracking-wider">
                  NĂM
                </span>
                <span className="text-xs sm:text-sm font-bold text-white mt-0.5">
                  {movie.year || "2026"}
                </span>
              </div>

              {/* Thời Lượng */}
              <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                <Clock className="w-4 h-4 text-brand-green/80 mb-1" />
                <span className="text-[10px] text-white/45 uppercase font-bold tracking-wider">
                  THỜI LƯỢNG
                </span>
                <span className="text-xs sm:text-sm font-bold text-white mt-0.5">
                  {movie.time || "Đang cập nhật"}
                </span>
              </div>

              {/* Định Dạng */}
              <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                <Film className="w-4 h-4 text-brand-green/80 mb-1" />
                <span className="text-[10px] text-white/45 uppercase font-bold tracking-wider">
                  ĐỊNH DẠNG
                </span>
                <span className="text-xs sm:text-sm font-bold text-white mt-0.5">
                  {movie.quality || "FHD"}
                </span>
              </div>

              {/* Bản Dịch */}
              <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
                <Languages className="w-4 h-4 text-brand-green/80 mb-1" />
                <span className="text-[10px] text-white/45 uppercase font-bold tracking-wider">
                  BẢN DỊCH
                </span>
                <span className="text-xs sm:text-sm font-bold text-white mt-0.5">
                  {movie.lang || "Vietsub"}
                </span>
              </div>
            </div>

            {/* Thể Loại (Categories) */}
            {categories.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white/60">
                  <Layers className="w-3.5 h-3.5 text-brand-green" />
                  <span>THỂ LOẠI</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {categories.map((cat, idx) => (
                    <Link
                      key={cat.slug || idx}
                      href={`/?category=${cat.slug}`}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-brand-green/15 hover:border-brand-green/40 hover:text-brand-green border border-white/10 text-xs font-medium text-white/80 transition-colors"
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Quốc Gia (Countries) */}
            {countries.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white/60">
                  <Globe className="w-3.5 h-3.5 text-brand-green" />
                  <span>QUỐC GIA</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {countries.map((c, idx) => (
                    <Link
                      key={c.slug || idx}
                      href={`/?country=${c.slug}`}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-brand-green/15 hover:border-brand-green/40 hover:text-brand-green border border-white/10 text-xs font-medium text-white/80 transition-colors"
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Đạo Diễn (Directors) */}
            {directorsList.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white/60">
                  <Clapperboard className="w-3.5 h-3.5 text-brand-green" />
                  <span>ĐẠO DIỄN</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {directorsList.map((director, idx) => (
                    <Link
                      key={idx}
                      href={`/search?query=${encodeURIComponent(director)}`}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-brand-green/15 hover:border-brand-green/40 hover:text-brand-green border border-white/10 text-xs font-medium text-white/80 transition-colors"
                    >
                      {director}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Diễn Viên (Actors) */}
            {actorsList.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white/60">
                  <Users className="w-3.5 h-3.5 text-brand-green" />
                  <span>DIỄN VIÊN</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {actorsList.map((actor, idx) => (
                    <Link
                      key={idx}
                      href={`/search?query=${encodeURIComponent(actor)}`}
                      className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-brand-green/15 hover:border-brand-green/40 hover:text-brand-green border border-white/10 text-xs font-medium text-white/80 transition-colors"
                    >
                      {actor}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
