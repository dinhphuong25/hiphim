"use client";

import React, { useState, useMemo } from "react";
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
  Star,
  FileText,
  Search,
  ListVideo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useFavorites, useWatchHistory } from "@/hooks/useLocalStorage";
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

const EPISODES_PER_RANGE = 50;

export default function MovieDetailView({ movie, episodes = [] }: MovieDetailViewProps) {
  const router = useRouter();
  const { user, checkAuthOrPrompt, updateServerData } = useUserAuth();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { history } = useWatchHistory();

  const [selectedServerIdx, setSelectedServerIdx] = useState(0);
  const [expandedContent, setExpandedContent] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [epSearchQuery, setEpSearchQuery] = useState("");
  const [activeRangeIdx, setActiveRangeIdx] = useState(0);

  const isFav = isFavorite(movie.slug);

  // Poster (2:3 vertical) & Backdrop (16:9 horizontal) image candidates
  const posterCandidates = getMovieImageCandidates(movie, "poster");
  const backdropCandidates = getMovieImageCandidates(movie, "backdrop");
  const posterImage =
    posterCandidates[0] || backdropCandidates[0] || movie.poster_url || movie.thumb_url || "/placeholder.svg";
  const heroImage =
    backdropCandidates[0] || posterCandidates[0] || movie.thumb_url || movie.poster_url || "/placeholder.svg";

  // Smart title splitting for long multi-alias titles separated by "/"
  const { primaryTitle, altTitles } = useMemo(() => {
    const rawName = (movie.name || "").trim();
    if (!rawName.includes("/")) {
      return { primaryTitle: rawName, altTitles: "" };
    }
    const parts = rawName
      .split("/")
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length <= 1) {
      return { primaryTitle: rawName, altTitles: "" };
    }
    return {
      primaryTitle: parts[0],
      altTitles: parts.slice(1).join(" • "),
    };
  }, [movie.name]);

  // Rating calculation
  const ratingScore = useMemo(() => {
    const raw = movie.tmdb?.vote_average || movie.imdb?.rating;
    if (typeof raw === "number" && raw > 0) {
      return raw.toFixed(1);
    }
    return null;
  }, [movie.tmdb?.vote_average, movie.imdb?.rating]);

  // Clean HTML from synopsis
  const cleanContent = useMemo(() => {
    if (!movie.content) return "";
    return movie.content
      .replace(/<[^>]*>/g, "")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&nbsp;/g, " ")
      .trim();
  }, [movie.content]);

  // Server & episodes
  const currentServer = episodes[selectedServerIdx] || episodes[0];
  const episodeList = currentServer?.server_data || [];
  const firstEpisodeSlug = episodeList[0]?.slug || "tap-01";

  // Check if user has a saved watch history entry for this movie
  const savedHistoryItem = useMemo(() => {
    if (!Array.isArray(history) || !movie?.slug) return null;
    return history.find((item) => item.slug === movie.slug) || null;
  }, [history, movie?.slug]);

  const resumeWatchInfo = useMemo(() => {
    if (!savedHistoryItem || episodeList.length === 0) return null;
    if (savedHistoryItem.episodeSlug) {
      const matched = episodeList.find((ep) => ep.slug === savedHistoryItem.episodeSlug);
      if (matched) {
        return {
          slug: matched.slug,
          label: savedHistoryItem.episodeName || matched.name,
        };
      }
    }
    if (
      typeof savedHistoryItem.episodeIndex === "number" &&
      savedHistoryItem.episodeIndex >= 0 &&
      savedHistoryItem.episodeIndex < episodeList.length
    ) {
      const matched = episodeList[savedHistoryItem.episodeIndex];
      return {
        slug: matched.slug || String(savedHistoryItem.episodeIndex + 1),
        label: savedHistoryItem.episodeName || matched.name,
      };
    }
    return null;
  }, [savedHistoryItem, episodeList]);

  const primaryWatchHref = resumeWatchInfo
    ? `/watch?slug=${movie.slug}&ep=${resumeWatchInfo.slug}&server=${selectedServerIdx}`
    : `/watch?slug=${movie.slug}&ep=${firstEpisodeSlug}&server=${selectedServerIdx}`;

  // Episode ranges & search filter for long series
  const totalRanges = Math.ceil(episodeList.length / EPISODES_PER_RANGE);
  const filteredEpisodes = useMemo(() => {
    const q = epSearchQuery.trim().toLowerCase();
    if (q) {
      return episodeList
        .map((ep, idx) => ({ ep, idx }))
        .filter(
          ({ ep, idx }) =>
            ep.name?.toLowerCase().includes(q) ||
            ep.slug?.toLowerCase().includes(q) ||
            String(idx + 1).includes(q)
        );
    }
    if (episodeList.length > EPISODES_PER_RANGE) {
      const start = activeRangeIdx * EPISODES_PER_RANGE;
      const end = start + EPISODES_PER_RANGE;
      return episodeList.slice(start, end).map((ep, i) => ({ ep, idx: start + i }));
    }
    return episodeList.map((ep, idx) => ({ ep, idx }));
  }, [episodeList, epSearchQuery, activeRangeIdx]);

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
      poster_url: movie.poster_url || posterImage,
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
      toast.success(`Đã thêm "${primaryTitle}" vào danh sách yêu thích!`);
    } else {
      toast.info(`Đã xóa khỏi danh sách yêu thích`);
    }
  };

  // Share action
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
          return;
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

  // Back action
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

  const formatEpName = (name: string) => {
    if (!name) return "Tập 1";
    const clean = name.trim();
    if (clean.toLowerCase().startsWith("tập") || clean.toLowerCase() === "full") return clean;
    return `Tập ${clean.padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#050807] text-white pb-24 lg:pb-16 selection:bg-brand-green selection:text-black">
      {/* ======================================================== */}
      {/* 1. CINEMA HERO SECTION (NETFLIX / APPLE TV+ / ROPHIM)    */}
      {/* ======================================================== */}
      <div className="relative w-full overflow-hidden border-b border-white/[0.06]">
        {/* Ambient Widescreen Backdrop Layer */}
        <div className="absolute inset-0 h-[300px] sm:h-[380px] md:h-[460px] lg:h-[520px] pointer-events-none">
          <Image
            src={heroImage}
            alt={movie.name}
            fill
            priority
            placeholder="blur"
            blurDataURL={STATIC_BLUR_DATA_URL}
            sizes="(max-width: 768px) 100vw, 1600px"
            className="object-cover object-[center_20%] scale-105 opacity-45 sm:opacity-40 blur-[1px] sm:blur-0 transition-transform duration-700"
          />
          {/* Top Gradient */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#050807]/90 via-[#050807]/40 to-transparent" />
          {/* Left-to-Right Cinema Gradient for Text Contrast on Desktop */}
          <div className="hidden md:block absolute inset-y-0 left-0 w-3/4 bg-gradient-to-r from-[#050807] via-[#050807]/85 to-transparent" />
          {/* Bottom Deep Fade into #050807 */}
          <div className="absolute inset-x-0 bottom-0 h-44 sm:h-56 md:h-64 bg-gradient-to-t from-[#050807] via-[#050807]/95 to-transparent" />
          {/* Subtle Emerald Ambient Glow */}
          <div className="hidden lg:block absolute -left-24 top-1/3 w-96 h-96 rounded-full bg-brand-green/[0.07] blur-[120px]" />
        </div>

        {/* Hero Foreground Container */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-3 sm:pt-5 pb-6 sm:pb-8 md:pb-10">
          {/* Top Bar: Back Button */}
          <div className="flex items-center justify-between mb-4 sm:mb-6 md:mb-8">
            <button
              type="button"
              onClick={handleBack}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-black/55 hover:bg-white/10 active:scale-95 backdrop-blur-md border border-white/15 hover:border-brand-green/40 text-xs sm:text-[13px] font-semibold text-white/90 hover:text-brand-green transition-all cursor-pointer shadow-lg"
              aria-label="Quay lại"
            >
              <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
              <span>Quay lại</span>
            </button>
          </div>

          {/* 2-Column Hero Grid: Vertical Poster (Left) + Identity & Actions (Right) */}
          <div className="flex flex-col sm:flex-row sm:items-end gap-5 sm:gap-7 md:gap-8 lg:gap-10">
            {/* LEFT COLUMN: 2:3 Cinema Poster Card */}
            <div className="relative mx-auto sm:mx-0 w-[145px] xs:w-[160px] sm:w-[190px] md:w-[220px] lg:w-[245px] shrink-0 group">
              <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#0D1411] border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85)] ring-1 ring-white/5">
                <Image
                  src={posterImage}
                  alt={primaryTitle}
                  fill
                  priority
                  placeholder="blur"
                  blurDataURL={STATIC_BLUR_DATA_URL}
                  sizes="(max-width: 640px) 160px, 245px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Subtle bottom gradient inside poster */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />

                {/* Poster Bottom Episode Status Badge */}
                {movie.episode_current && (
                  <div className="absolute bottom-2.5 inset-x-2.5 flex justify-center">
                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-brand-green/90 text-[#050807] shadow-lg backdrop-blur-md truncate max-w-full">
                      {movie.episode_current}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: Movie Title, Subtitle & Bottom Action Bar */}
            <div className="flex-1 min-w-0 w-full flex flex-col justify-end text-center sm:text-left space-y-4 sm:space-y-5 md:pt-2">
              {/* Primary Title + Smart Subtitle (Origin Name & Alternate "/" Titles) */}
              <div className="space-y-1.5">
                <h1
                  className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-[1.2] line-clamp-2 drop-shadow-[0_4px_20px_rgba(0,0,0,0.9)]"
                  title={movie.name}
                >
                  {primaryTitle}
                </h1>

                {(movie.origin_name || altTitles) && (
                  <div className="space-y-0.5">
                    {movie.origin_name && (
                      <p className="text-xs sm:text-sm md:text-[15px] text-brand-green/90 font-semibold tracking-wide line-clamp-1">
                        {movie.origin_name}
                      </p>
                    )}
                    {altTitles && (
                      <p
                        className="text-[11.5px] sm:text-xs text-white/50 font-medium line-clamp-1"
                        title={altTitles}
                      >
                        Tên khác: {altTitles}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* BOTTOM ACTION BAR: Watch CTA (Left) + Favorite & Share Pinned to Bottom-Right Corner */}
              <div className="pt-2 sm:pt-3 w-full flex items-center justify-between gap-2 sm:gap-4">
                {/* Left Cluster: Primary Watch CTA & Episode Jump */}
                <div className="flex items-center gap-2 sm:gap-2.5 flex-1 sm:flex-initial min-w-0">
                  <Link
                    href={primaryWatchHref}
                    className="flex-1 sm:flex-initial sm:min-w-[200px] h-11 sm:h-12 px-3.5 sm:px-7 rounded-xl bg-gradient-to-r from-[#20D66B] to-[#10B981] hover:brightness-110 active:scale-[0.98] text-[#050807] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_8px_28px_rgba(32,214,107,0.35)] transition-all cursor-pointer uppercase tracking-wide whitespace-nowrap"
                  >
                    <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-current text-[#050807] shrink-0" />
                    <span className="whitespace-nowrap">
                      {resumeWatchInfo
                        ? `TIẾP TỤC XEM (${formatEpName(resumeWatchInfo.label)})`
                        : `XEM PHIM ${movie.episode_current ? `(${movie.episode_current})` : "NGAY"}`}
                    </span>
                  </Link>

                  {episodeList.length > 1 && (
                    <a
                      href="#episode-section"
                      className="hidden md:inline-flex px-4 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.1] border border-white/10 hover:border-brand-green/35 text-xs sm:text-sm font-semibold text-white/80 hover:text-brand-green items-center gap-2 transition-all shrink-0"
                    >
                      <ListVideo className="w-4 h-4" />
                      <span>Chọn Tập ({episodeList.length})</span>
                    </a>
                  )}
                </div>

                {/* Far Bottom-Right Corner Cluster: Favorite & Share (Icon-only on mobile, full text on sm+) */}
                <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0 ml-auto">
                  <button
                    type="button"
                    onClick={handleToggleFav}
                    className={cn(
                      "h-11 sm:h-12 px-3 sm:px-4 rounded-xl backdrop-blur-md border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer active:scale-95 shadow-lg shrink-0",
                      isFav
                        ? "bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.25)]"
                        : "bg-black/55 hover:bg-white/[0.1] border-white/15 text-white hover:border-rose-400/40 hover:text-rose-400"
                    )}
                    aria-label={isFav ? "Bỏ yêu thích" : "Yêu thích"}
                    title={isFav ? "Bỏ yêu thích" : "Lưu vào yêu thích"}
                  >
                    <Heart
                      className={cn(
                        "w-4 h-4 transition-colors shrink-0",
                        isFav ? "fill-rose-500 text-rose-500" : "text-white/85"
                      )}
                    />
                    <span className="hidden sm:inline">{isFav ? "Đã Thích" : "Yêu Thích"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className={cn(
                      "h-11 sm:h-12 px-3 sm:px-4 rounded-xl backdrop-blur-md border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all cursor-pointer active:scale-95 shadow-lg shrink-0",
                      shareCopied
                        ? "bg-brand-green/15 border-brand-green/40 text-brand-green"
                        : "bg-black/55 hover:bg-white/[0.1] border-white/15 text-white hover:border-brand-green/40 hover:text-brand-green"
                    )}
                    aria-label="Chia sẻ phim"
                    title="Chia sẻ phim"
                  >
                    {shareCopied ? (
                      <Check className="w-4 h-4 text-brand-green stroke-[2.8] shrink-0" />
                    ) : (
                      <Share2 className="w-4 h-4 text-white/85 shrink-0" />
                    )}
                    <span className="hidden sm:inline">{shareCopied ? "Đã Chép" : "Chia Sẻ"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. ASYMMETRIC 2-COLUMN BODY CONTENT                      */}
      {/* ======================================================== */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          {/* LEFT / MAIN COLUMN (8/12 on Desktop): Synopsis + Episode Selector */}
          <div className="lg:col-span-8 space-y-6">
            {/* SYNOPSIS CARD */}
            {cleanContent && (
              <section className="rounded-2xl bg-white/[0.025] border border-white/[0.08] p-4 sm:p-6 space-y-2.5">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-brand-green stroke-[2.3]" />
                  <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
                    Nội Dung Phim
                  </h2>
                </div>
                <p
                  className={cn(
                    "text-xs sm:text-[14px] text-white/75 leading-relaxed text-justify transition-all duration-200",
                    !expandedContent && "line-clamp-4 sm:line-clamp-5"
                  )}
                >
                  {cleanContent}
                </p>
                {cleanContent.length > 220 && (
                  <button
                    type="button"
                    onClick={() => setExpandedContent((prev) => !prev)}
                    className="text-xs font-bold text-brand-green hover:text-emerald-400 cursor-pointer pt-1 inline-flex items-center gap-1"
                  >
                    <span>{expandedContent ? "Thu gọn nội dung ▴" : "Xem toàn bộ nội dung ▾"}</span>
                  </button>
                )}
              </section>
            )}

            {/* EPISODES & SERVERS CARD */}
            {episodes.length > 0 && episodeList.length > 0 && (
              <section
                id="episode-section"
                className="rounded-2xl bg-white/[0.025] border border-white/[0.08] p-4 sm:p-6 space-y-4 scroll-mt-20"
              >
                {/* Header & Server Switcher */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.07]">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-brand-green/15 border border-brand-green/30 flex items-center justify-center text-brand-green">
                      <Tv className="w-4 h-4 stroke-[2.3]" />
                    </div>
                    <div>
                      <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
                        Danh Sách Tập
                      </h2>
                      <p className="text-[11px] text-white/45">
                        Hiện có {episodeList.length} tập • Chọn tập để bắt đầu phát
                      </p>
                    </div>
                  </div>

                  {/* Multi-server switcher pills */}
                  {episodes.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                      {episodes.map((srv, idx) => (
                        <button
                          key={srv.server_name || idx}
                          type="button"
                          onClick={() => {
                            setSelectedServerIdx(idx);
                            setActiveRangeIdx(0);
                          }}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer active:scale-95",
                            selectedServerIdx === idx
                              ? "bg-brand-green text-[#050807] shadow-[0_0_16px_rgba(32,214,107,0.3)]"
                              : "bg-white/[0.05] text-white/65 hover:text-white hover:bg-white/[0.1] border border-white/10"
                          )}
                        >
                          {srv.server_name || `Server ${idx + 1}`}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Range Tabs & Quick Episode Search when > 20 episodes */}
                {episodeList.length > 20 && (
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                    {totalRanges > 1 && !epSearchQuery && (
                      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                        {Array.from({ length: totalRanges }).map((_, rIdx) => {
                          const startEp = rIdx * EPISODES_PER_RANGE + 1;
                          const endEp = Math.min((rIdx + 1) * EPISODES_PER_RANGE, episodeList.length);
                          return (
                            <button
                              key={rIdx}
                              type="button"
                              onClick={() => setActiveRangeIdx(rIdx)}
                              className={cn(
                                "px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer",
                                activeRangeIdx === rIdx
                                  ? "bg-brand-green/20 text-brand-green border border-brand-green/40"
                                  : "bg-white/[0.04] text-white/55 hover:text-white border border-white/10"
                              )}
                            >
                              Tập {startEp} - {endEp}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    <div className="relative w-full sm:w-48 ml-auto">
                      <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={epSearchQuery}
                        onChange={(e) => setEpSearchQuery(e.target.value)}
                        placeholder="Tìm số tập..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-black/50 border border-white/10 focus:border-brand-green/50 text-xs text-white placeholder:text-white/35 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                {/* Episode Grid */}
                <div className="grid grid-cols-4 xs:grid-cols-5 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2 sm:gap-2.5 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                  {filteredEpisodes.map(({ ep, idx }) => {
                    const isLastWatched =
                      resumeWatchInfo &&
                      (ep.slug === resumeWatchInfo.slug ||
                        savedHistoryItem?.episodeIndex === idx);
                    return (
                      <Link
                        key={ep.slug || idx}
                        href={`/watch?slug=${movie.slug}&ep=${ep.slug || idx + 1}&server=${selectedServerIdx}`}
                        className={cn(
                          "relative py-2.5 px-2 rounded-xl text-xs sm:text-[13px] font-bold text-center transition-all flex items-center justify-center truncate group active:scale-95",
                          isLastWatched
                            ? "bg-brand-green/20 border border-brand-green text-brand-green shadow-[0_0_12px_rgba(32,214,107,0.2)]"
                            : "bg-white/[0.04] hover:bg-brand-green/15 hover:border-brand-green/40 hover:text-brand-green border border-white/10 text-white/90"
                        )}
                        title={
                          isLastWatched
                            ? `Đang xem dở: ${formatEpName(ep.name)}`
                            : formatEpName(ep.name)
                        }
                      >
                        <span className="truncate group-hover:scale-105 transition-transform">
                          {formatEpName(ep.name)}
                        </span>
                        {isLastWatched && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-green absolute top-1.5 right-1.5 animate-pulse" />
                        )}
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}
          </div>

          {/* RIGHT SIDEBAR COLUMN (4/12 on Desktop): Movie Specifications & Cast */}
          <aside className="lg:col-span-4 space-y-6">
            <section className="rounded-2xl bg-white/[0.025] border border-white/[0.08] p-4 sm:p-6 space-y-4">
              <div className="flex items-center gap-2 pb-2.5 border-b border-white/[0.07]">
                <Info className="w-4 h-4 text-brand-green stroke-[2.4]" />
                <h2 className="text-sm sm:text-base font-bold text-white tracking-wide uppercase">
                  Thông Tin Chi Tiết
                </h2>
              </div>

              {/* 2x2 Quick Specs Mini Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-[10px] text-white/45 uppercase font-bold tracking-wider block">
                    Năm Phát Hành
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-white mt-0.5 block">
                    {movie.year || "2026"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-[10px] text-white/45 uppercase font-bold tracking-wider block">
                    Thời Lượng
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-white mt-0.5 block truncate">
                    {movie.time || "Đang cập nhật"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-[10px] text-white/45 uppercase font-bold tracking-wider block">
                    Chất Lượng
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-brand-green mt-0.5 block">
                    {movie.quality || "FHD"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                  <span className="text-[10px] text-white/45 uppercase font-bold tracking-wider block">
                    Ngôn Ngữ
                  </span>
                  <span className="text-xs sm:text-sm font-extrabold text-white mt-0.5 block truncate">
                    {movie.lang || "Vietsub"}
                  </span>
                </div>
              </div>

              {/* Countries */}
              {countries.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/55 uppercase tracking-wider">
                    <Globe className="w-3.5 h-3.5 text-brand-green" />
                    <span>Quốc Gia</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {countries.map((c, idx) => (
                      <Link
                        key={c.slug || idx}
                        href={`/?country=${c.slug}`}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-brand-green/15 hover:border-brand-green/40 hover:text-brand-green border border-white/10 text-xs font-medium text-white/85 transition-colors"
                      >
                        {c.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Categories */}
              {categories.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/55 uppercase tracking-wider">
                    <Layers className="w-3.5 h-3.5 text-brand-green" />
                    <span>Thể Loại</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {categories.map((cat, idx) => (
                      <Link
                        key={cat.slug || idx}
                        href={`/?category=${cat.slug}`}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-brand-green/15 hover:border-brand-green/40 hover:text-brand-green border border-white/10 text-xs font-medium text-white/85 transition-colors"
                      >
                        {cat.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Directors */}
              {directorsList.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/55 uppercase tracking-wider">
                    <Clapperboard className="w-3.5 h-3.5 text-brand-green" />
                    <span>Đạo Diễn</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {directorsList.map((director, idx) => (
                      <Link
                        key={idx}
                        href={`/search?query=${encodeURIComponent(director)}`}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-brand-green/15 hover:border-brand-green/40 hover:text-brand-green border border-white/10 text-xs font-medium text-white/85 transition-colors"
                      >
                        {director}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Actors */}
              {actorsList.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-white/55 uppercase tracking-wider">
                    <Users className="w-3.5 h-3.5 text-brand-green" />
                    <span>Diễn Viên</span>
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {actorsList.map((actor, idx) => (
                      <Link
                        key={idx}
                        href={`/search?query=${encodeURIComponent(actor)}`}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-brand-green/15 hover:border-brand-green/40 hover:text-brand-green border border-white/10 text-xs font-medium text-white/85 transition-colors"
                      >
                        {actor}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
