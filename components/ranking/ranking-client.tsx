"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Trophy, 
  Flame, 
  TrendingUp, 
  Calendar, 
  Eye, 
  Star, 
  Play, 
  Crown, 
  Medal, 
  Film,
  Sparkles,
  Tv,
  Clapperboard,
  Smile
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getMovieImageCandidates } from "@/lib/image-helper";
import type { AllRankingsData, RankingMovieItem, RankingPeriod } from "@/lib/data";

interface RankingClientProps {
  initialData: AllRankingsData;
}

type MovieTypeFilter = "all" | "cinema" | "series" | "single" | "anime";

interface TabMeta {
  id: RankingPeriod;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
  badge: string;
}

const TABS: TabMeta[] = [
  { 
    id: "day", 
    label: "Top Ngày", 
    icon: Flame, 
    desc: "Top 20 tác phẩm được xem nhiều nhất trong 24 giờ qua",
    badge: "Hôm nay" 
  },
  { 
    id: "week", 
    label: "Top Tuần", 
    icon: TrendingUp, 
    desc: "Bảng xếp hạng xu hướng thịnh hành bứt phá trong tuần",
    badge: "Tuần này" 
  },
  { 
    id: "month", 
    label: "Top Tháng", 
    icon: Calendar, 
    desc: "Những siêu phẩm thống trị phòng vé & bảng xếp hạng tháng",
    badge: "Tháng này" 
  },
  { 
    id: "views", 
    label: "Top Lượt Xem", 
    icon: Eye, 
    desc: "Kỷ lục tác phẩm có lượt xem cao nhất mọi thời đại",
    badge: "Kỷ lục view" 
  },
  { 
    id: "rating", 
    label: "Top Đánh Giá", 
    icon: Star, 
    desc: "Các kiệt tác điện ảnh có điểm số TMDB / IMDb cao nhất",
    badge: "Điểm cao" 
  },
];

const TYPE_FILTERS: Array<{ id: MovieTypeFilter; label: string; icon: React.ComponentType<{ className?: string }> }> = [
  { id: "all", label: "Tất cả", icon: Sparkles },
  { id: "cinema", label: "Chiếu Rạp", icon: Clapperboard },
  { id: "series", label: "Phim Bộ", icon: Tv },
  { id: "single", label: "Phim Lẻ", icon: Film },
  { id: "anime", label: "Hoạt Hình", icon: Smile },
];

function RankingImage({
  movie,
  type = "poster",
  sizes,
  className = "object-cover",
}: {
  movie: RankingMovieItem;
  type?: "poster" | "backdrop";
  sizes?: string;
  className?: string;
}) {
  const [candidateIdx, setCandidateIdx] = useState(0);
  const [hasError, setHasError] = useState(false);
  const candidates = useMemo(() => getMovieImageCandidates(movie, type), [movie, type]);
  const src = !hasError && candidates.length > 0 ? candidates[candidateIdx] : null;

  if (!src) {
    return (
      <div className="w-full h-full bg-[#0c1310] flex flex-col items-center justify-center p-1.5 text-center select-none">
        <Film className="w-5 h-5 text-[#20D66B]/60 mb-0.5" />
        <span className="text-[9px] text-white/70 line-clamp-1">{movie.name}</span>
      </div>
    );
  }

  return (
    <Image
      key={`${movie.slug}-${type}-${candidateIdx}`}
      src={src}
      alt={movie.name}
      fill
      sizes={sizes}
      className={className}
      onError={() => {
        if (candidateIdx + 1 < candidates.length) setCandidateIdx((i) => i + 1);
        else setHasError(true);
      }}
    />
  );
}

function getRating(movie: RankingMovieItem): number | null {
  const tmdb = movie.tmdb?.vote_average;
  const imdb = movie.imdb?.vote_average;
  if (tmdb && tmdb > 0) return Number(tmdb.toFixed(1));
  if (imdb && imdb > 0) return Number(imdb.toFixed(1));
  return null;
}

function formatViews(num?: number): string {
  if (!num || num <= 0) return "10K+";
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${Math.round(num / 1_000)}K`;
  return num.toLocaleString();
}

export default function RankingClient({ initialData }: RankingClientProps) {
  const [activeTab, setActiveTab] = useState<RankingPeriod>("day");
  const [typeFilter, setTypeFilter] = useState<MovieTypeFilter>("all");

  const rawList = useMemo(() => {
    return initialData?.[activeTab] || [];
  }, [initialData, activeTab]);

  const filteredList = useMemo(() => {
    if (typeFilter === "all") return rawList;
    return rawList.filter((m) => {
      const type = (m.type || "").toLowerCase();
      const slug = (m.slug || "").toLowerCase();
      const categories = (m.category || []).map((c) => (c.name || "").toLowerCase());
      const catSlugs = (m.category || []).map((c) => (c.slug || "").toLowerCase());

      if (typeFilter === "cinema") {
        return categories.some((c) => c.includes("chiếu rạp")) || catSlugs.includes("phim-chieu-rap");
      }
      if (typeFilter === "series") {
        return type === "series" || categories.some((c) => c.includes("bộ")) || Boolean(m.episode_current && m.episode_current.toLowerCase().includes("tập"));
      }
      if (typeFilter === "single") {
        return type === "single" || categories.some((c) => c.includes("lẻ")) || (m.episode_current && m.episode_current.toLowerCase().includes("full"));
      }
      if (typeFilter === "anime") {
        return categories.some((c) => c.includes("hoạt hình") || c.includes("anime")) || type === "hoathinh" || slug.includes("hoat-hinh");
      }
      return true;
    });
  }, [rawList, typeFilter]);

  const top3 = filteredList.slice(0, 3);
  const restRankings = filteredList.slice(3);
  const activeTabMeta = TABS.find((t) => t.id === activeTab) || TABS[0];

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      {/* ========================================================= */}
      {/* 1. CINEMATIC STAGE HEADER (COMPACT ON MOBILE)             */}
      {/* ========================================================= */}
      <header className="relative mb-3.5 sm:mb-8 overflow-hidden rounded-xl sm:rounded-3xl bg-gradient-to-b from-[#111A15] via-[#0D1411] to-[#080D0B] border border-white/[0.08] p-3 sm:p-7 lg:p-8 shadow-2xl w-full min-w-0">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 sm:w-80 h-64 sm:h-80 bg-[#20D66B]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 -mb-20 w-48 sm:w-64 h-48 sm:h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-2.5 sm:gap-6">
          <div className="space-y-1 sm:space-y-2">
            {/* Live Indicator */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#20D66B]/15 border border-[#20D66B]/30 text-[#20D66B] text-[10px] sm:text-xs font-black uppercase tracking-wider">
              <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#20D66B] opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-[#20D66B]" />
              </span>
              <span>Bảng Xếp Hạng Điện Ảnh Hi Phim</span>
            </div>

            {/* Page Title */}
            <h1 className="text-lg sm:text-3xl lg:text-4xl font-black tracking-tight text-white flex items-center gap-2">
              <span>BẢNG XẾP HẠNG</span>
              <span className="text-[#20D66B]">PHIM</span>
            </h1>

            {/* Dynamic Tab Description */}
            <p className="text-[11px] sm:text-sm text-white/60 font-medium leading-tight sm:leading-relaxed line-clamp-1 sm:line-clamp-none">
              {activeTabMeta.desc}
            </p>
          </div>

          {/* Quick stats pill */}
          <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-white/70 backdrop-blur-md">
            <Trophy className="w-3.5 h-3.5 text-[#20D66B]" />
            <span>Top 20 xuất sắc nhất</span>
          </div>
        </div>

        {/* 5 Period Navigation Tabs */}
        <div className="mt-3 sm:mt-6 pt-2.5 sm:pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 scrollbar-none -mx-1 px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-x">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "group relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 cursor-pointer select-none active:scale-95",
                    isActive
                      ? "bg-gradient-to-r from-[#20D66B] to-[#10B981] text-[#050807] shadow-md shadow-[#20D66B]/25 scale-[1.02]"
                      : "bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border border-white/[0.06]"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "stroke-[2.5]" : "stroke-2")} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. SUB-FILTERS: MOVIE CATEGORY TYPES                      */}
      {/* ========================================================= */}
      <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 mb-4 sm:mb-6 scrollbar-none -mx-1 px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden touch-pan-x">
        <span className="text-[10px] sm:text-[11px] font-bold text-white/40 uppercase tracking-wider mr-1 shrink-0 hidden sm:inline-block">
          Thể loại:
        </span>
        {TYPE_FILTERS.map((f) => {
          const Icon = f.icon;
          const isActive = typeFilter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className={cn(
                "flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold whitespace-nowrap transition-all duration-200 cursor-pointer select-none active:scale-95",
                isActive
                  ? "bg-[#20D66B]/20 text-[#20D66B] border border-[#20D66B]/50 shadow-[0_0_12px_rgba(32,214,107,0.15)]"
                  : "bg-white/[0.03] hover:bg-white/[0.07] text-white/60 hover:text-white border border-white/[0.06]"
              )}
            >
              <Icon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              <span>{f.label}</span>
            </button>
          );
        })}
      </div>

      {filteredList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          <Trophy className="w-10 h-10 text-white/20 mb-2 stroke-1" />
          <h3 className="text-sm sm:text-base font-bold text-white mb-1">Chưa có phim trong mục này</h3>
          <p className="text-xs text-white/50">Vui lòng chọn danh mục hoặc bộ lọc khác để xem bảng xếp hạng.</p>
        </div>
      ) : (
        <>
          {/* ========================================================= */}
          {/* 3. TOP 3 HALL OF FAME (PODIUM)                            */}
          {/* ========================================================= */}
          {top3.length > 0 && (
            <section className="mb-6 sm:mb-12 w-full min-w-0 max-w-full overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-3 sm:mb-5">
                <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                  <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400 shrink-0" />
                  <h2 className="text-sm sm:text-xl font-black text-white uppercase tracking-wider truncate">
                    Top 3 Vinh Danh
                  </h2>
                </div>
                <span className="text-[10px] sm:text-[11px] font-bold text-white/40 uppercase tracking-wider shrink-0">
                  Bục vinh quang
                </span>
              </div>

              {/* ----------------------------------------------------- */}
              {/* DESKTOP PODIUM (2 - 1 - 3 Olympic Elevation)           */}
              {/* ----------------------------------------------------- */}
              <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 items-end w-full min-w-0">
                {/* RANK 2 - SILVER (Left) */}
                {top3[1] && (
                  <div className="order-1 w-full min-w-0">
                    <DesktopPodiumCard movie={top3[1]} rank={2} theme="silver" />
                  </div>
                )}

                {/* RANK 1 - GOLD CHAMPION (Center Elevated) */}
                {top3[0] && (
                  <div className="order-2 md:-translate-y-4 lg:-translate-y-6 w-full min-w-0">
                    <DesktopPodiumCard movie={top3[0]} rank={1} theme="gold" isChampion />
                  </div>
                )}

                {/* RANK 3 - BRONZE (Right) */}
                {top3[2] && (
                  <div className="order-3 w-full min-w-0">
                    <DesktopPodiumCard movie={top3[2]} rank={3} theme="bronze" />
                  </div>
                )}
              </div>

              {/* ----------------------------------------------------- */}
              {/* MOBILE TOP 3 PODIUM (Olympic 3-Column Mini Elevation)  */}
              {/* ----------------------------------------------------- */}
              <div className="grid md:hidden grid-cols-3 gap-1.5 xs:gap-2 items-end pt-3 pb-1 w-full min-w-0 max-w-full">
                {/* RANK 2 - SILVER (Left) */}
                {top3[1] ? (
                  <MobilePodiumColumn movie={top3[1]} rank={2} theme="silver" />
                ) : <div />}

                {/* RANK 1 - GOLD CHAMPION (Center, Elevated) */}
                {top3[0] ? (
                  <MobilePodiumColumn movie={top3[0]} rank={1} theme="gold" isChampion />
                ) : <div />}

                {/* RANK 3 - BRONZE (Right) */}
                {top3[2] ? (
                  <MobilePodiumColumn movie={top3[2]} rank={3} theme="bronze" />
                ) : <div />}
              </div>
            </section>
          )}

          {/* ========================================================= */}
          {/* 4. LEADERBOARD LIST (RANK 4 - 20)                         */}
          {/* ========================================================= */}
          {restRankings.length > 0 && (
            <section className="space-y-2.5 sm:space-y-3">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-2 sm:pb-3 mb-2.5 sm:mb-3">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#20D66B]" />
                  <h3 className="text-xs sm:text-base font-black text-white uppercase tracking-wider">
                    Bảng Xếp Hạng Hạng 4 - 20
                  </h3>
                </div>
                <span className="text-[11px] sm:text-xs text-white/50 font-bold">
                  {restRankings.length} tác phẩm
                </span>
              </div>

              <div className="space-y-2 sm:space-y-2.5">
                {restRankings.map((movie, idx) => {
                  const rank = idx + 4;
                  return (
                    <LeaderboardRow key={movie._id || movie.slug} movie={movie} rank={rank} />
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ============================================================= */
/* MOBILE 3-PODIUM COLUMN COMPONENT (OLYMPIC 2 - 1 - 3)          */
/* ============================================================= */

interface MobilePodiumColumnProps {
  movie: RankingMovieItem;
  rank: number;
  theme: "gold" | "silver" | "bronze";
  isChampion?: boolean;
}

function MobilePodiumColumn({ movie, rank, theme, isChampion }: MobilePodiumColumnProps) {
  const rating = getRating(movie);

  const config = {
    gold: {
      border: "border-2 border-amber-400/90",
      glow: "shadow-[0_0_16px_rgba(251,191,36,0.3)]",
      badgeBg: "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black font-black",
      badgeText: "QUÁN QUÂN",
      titleColor: "text-amber-300",
      pedestalBg: "bg-amber-400/10 border-amber-400/35",
      icon: Crown,
    },
    silver: {
      border: "border border-slate-300/60",
      glow: "shadow-[0_0_10px_rgba(203,213,225,0.15)]",
      badgeBg: "bg-gradient-to-r from-slate-200 to-slate-400 text-black font-black",
      badgeText: "Á QUÂN",
      titleColor: "text-slate-200",
      pedestalBg: "bg-slate-300/10 border-slate-300/25",
      icon: Medal,
    },
    bronze: {
      border: "border border-amber-700/60",
      glow: "shadow-[0_0_10px_rgba(217,119,6,0.15)]",
      badgeBg: "bg-gradient-to-r from-amber-700 to-amber-600 text-white font-black",
      badgeText: "QUÝ QUÂN",
      titleColor: "text-amber-500",
      pedestalBg: "bg-amber-700/10 border-amber-700/25",
      icon: Medal,
    },
  }[theme];

  const Icon = config.icon;

  return (
    <Link
      href={`/phim/${movie.slug}`}
      className={cn(
        "group relative flex flex-col items-center text-center select-none active:scale-95 transition-transform w-full min-w-0 max-w-full",
        isChampion ? "-translate-y-2 z-10" : "z-0"
      )}
    >
      {/* Top Floating Badge */}
      <div className={cn(
        "mb-1 px-1.5 py-0.5 rounded-full text-[9px] font-black tracking-wider flex items-center gap-0.5 shadow-md shrink-0",
        config.badgeBg
      )}>
        <Icon className="w-2.5 h-2.5 fill-current shrink-0" />
        <span>#{rank}</span>
      </div>

      {/* Poster Frame (Portrait 2:3 ratio) */}
      <div className={cn(
        "relative w-full aspect-[2/3] rounded-xl overflow-hidden bg-[#0A0E0C] transition-all min-w-0",
        config.border,
        config.glow
      )}>
        <RankingImage
          movie={movie}
          type="poster"
          sizes="(max-width: 768px) 33vw, 200px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent pointer-events-none" />

        {/* Bottom Poster Tag: Rating or Quality */}
        <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between z-10 px-0.5 pointer-events-none">
          {rating ? (
            <span className="flex items-center gap-0.5 px-1 py-0.2 rounded bg-black/85 backdrop-blur-sm text-amber-400 text-[8.5px] font-black">
              <Star className="w-2.5 h-2.5 fill-amber-400" />
              {rating}
            </span>
          ) : <span />}

          {movie.quality && (
            <span className="px-1 py-0.2 rounded bg-black/85 backdrop-blur-sm text-[#20D66B] text-[8px] font-bold">
              {movie.quality}
            </span>
          )}
        </div>

        {/* Play Icon on Center */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity bg-black/40 pointer-events-none">
          <div className="w-8 h-8 rounded-full bg-[#20D66B] flex items-center justify-center text-[#050807] shadow-lg">
            <Play className="w-3.5 h-3.5 fill-[#050807] ml-0.5" />
          </div>
        </div>
      </div>

      {/* Movie Info & Pedestal Base */}
      <div className={cn(
        "w-full min-w-0 mt-1.5 p-1.5 rounded-lg border flex flex-col justify-between overflow-hidden",
        config.pedestalBg,
        isChampion ? "min-h-[48px]" : "min-h-[44px]"
      )}>
        <h4 className={cn("w-full text-[10.5px] font-bold leading-tight truncate", config.titleColor)} title={movie.name}>
          {movie.name}
        </h4>
        <div className="flex items-center justify-center gap-1 mt-0.5 text-[8.5px] text-white/50 w-full truncate">
          <span>{movie.year || "Phim Hot"}</span>
          <span>•</span>
          <span className="text-[#20D66B] font-bold flex items-center gap-0.5 shrink-0">
            <Play className="w-2 h-2 fill-current" /> Xem
          </span>
        </div>
      </div>
    </Link>
  );
}

/* ============================================================= */
/* DESKTOP PODIUM CARD COMPONENT                                 */
/* ============================================================= */

interface DesktopPodiumCardProps {
  movie: RankingMovieItem;
  rank: number;
  theme: "gold" | "silver" | "bronze";
  isChampion?: boolean;
}

function DesktopPodiumCard({ movie, rank, theme, isChampion }: DesktopPodiumCardProps) {
  const rating = getRating(movie);

  const config = {
    gold: {
      border: "border-amber-400/70 hover:border-amber-400",
      glow: "shadow-[0_0_45px_rgba(251,191,36,0.2)]",
      badgeBg: "bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 text-black",
      pedestalBg: "bg-amber-400/10",
      icon: Crown,
      medalText: "QUÁN QUÂN",
    },
    silver: {
      border: "border-slate-300/40 hover:border-slate-200",
      glow: "shadow-[0_0_35px_rgba(203,213,225,0.12)]",
      badgeBg: "bg-gradient-to-r from-slate-200 to-slate-400 text-black",
      pedestalBg: "bg-slate-300/10",
      icon: Medal,
      medalText: "Á QUÂN",
    },
    bronze: {
      border: "border-amber-700/50 hover:border-amber-600",
      glow: "shadow-[0_0_35px_rgba(217,119,6,0.12)]",
      badgeBg: "bg-gradient-to-r from-amber-700 to-amber-600 text-white",
      pedestalBg: "bg-amber-700/10",
      icon: Medal,
      medalText: "QUÝ QUÂN",
    },
  }[theme];

  const Icon = config.icon;

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl overflow-hidden bg-[#0F1613] border transition-all duration-300 hover:-translate-y-2",
        config.border,
        config.glow
      )}
    >
      {/* Top Banner with Rank Badge */}
      <div className={cn("px-4 py-2.5 flex items-center justify-between border-b border-white/[0.08]", config.pedestalBg)}>
        <div className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider flex items-center gap-1 shadow-md", config.badgeBg)}>
          <Icon className="w-3.5 h-3.5 fill-current" />
          <span>#{rank} {config.medalText}</span>
        </div>

        {rating && (
          <div className="flex items-center gap-1 text-xs font-black text-amber-400">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{rating}</span>
          </div>
        )}
      </div>

      {/* Poster / Backdrop Image */}
      <Link href={`/phim/${movie.slug}`} className="relative aspect-[16/10] w-full overflow-hidden bg-[#0A0E0C] block">
        <RankingImage
          movie={movie}
          type="backdrop"
          sizes="(max-width: 1024px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0F1613] via-transparent to-black/30" />

        {/* Quality and Year Badges */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
          {movie.quality && (
            <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-bold text-[#20D66B] border border-[#20D66B]/30">
              {movie.quality}
            </span>
          )}
          {movie.year && (
            <span className="px-2 py-0.5 rounded bg-black/75 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
              {movie.year}
            </span>
          )}
        </div>

        {/* Play Icon Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-black/40 backdrop-blur-[2px]">
          <div className="w-12 h-12 rounded-full bg-[#20D66B] flex items-center justify-center text-[#050807] shadow-xl scale-90 group-hover:scale-100 transition-transform">
            <Play className="w-5 h-5 fill-[#050807] ml-0.5" />
          </div>
        </div>
      </Link>

      {/* Details */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        <div>
          <Link href={`/phim/${movie.slug}`}>
            <h3 className="text-base sm:text-lg font-black text-white group-hover:text-[#20D66B] transition-colors line-clamp-1">
              {movie.name}
            </h3>
          </Link>
          {movie.origin_name && (
            <p className="text-xs text-white/50 font-medium line-clamp-1 mt-0.5">
              {movie.origin_name}
            </p>
          )}

          {/* Categories */}
          {movie.category && movie.category.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {movie.category.slice(0, 3).map((c, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/[0.04] text-white/70 border border-white/[0.06]"
                >
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
          <span className="text-xs font-semibold text-white/50 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-white/40" />
            <span>{formatViews(movie.view)}</span>
          </span>

          <Link
            href={`/phim/${movie.slug}`}
            className={cn(
              "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95",
              isChampion
                ? "bg-gradient-to-r from-[#20D66B] to-[#10B981] text-[#050807] hover:brightness-110 shadow-md shadow-[#20D66B]/20"
                : "bg-white/10 hover:bg-white/20 text-white"
            )}
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Xem ngay</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ============================================================= */
/* LEADERBOARD ROW COMPONENT (RANK 4 - 20)                        */
/* ============================================================= */

interface LeaderboardRowProps {
  movie: RankingMovieItem;
  rank: number;
}

function LeaderboardRow({ movie, rank }: LeaderboardRowProps) {
  const rating = getRating(movie);
  const isTop10 = rank <= 10;

  return (
    <Link
      href={`/phim/${movie.slug}`}
      className="group relative flex items-center gap-2 sm:gap-4 p-1.5 sm:p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/[0.06] hover:border-[#20D66B]/40 transition-all duration-200 active:scale-[0.99] w-full min-w-0"
    >
      {/* Big Typographic Rank Number */}
      <div className="w-7 sm:w-14 shrink-0 text-center">
        <span
          className={cn(
            "text-xs sm:text-2xl font-black font-mono italic tracking-tighter transition-colors",
            isTop10
              ? "text-[#20D66B] group-hover:drop-shadow-[0_0_8px_rgba(32,214,107,0.5)]"
              : "text-white/30 group-hover:text-white/60"
          )}
        >
          #{rank < 10 ? `0${rank}` : rank}
        </span>
      </div>

      {/* Thumbnail Poster */}
      <div className="relative w-10 sm:w-16 aspect-[2/3] shrink-0 rounded-lg overflow-hidden bg-[#0A0E0C] border border-white/[0.08] group-hover:border-[#20D66B]/50 transition-colors">
        <RankingImage
          movie={movie}
          type="poster"
          sizes="(max-width: 640px) 44px, 80px"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 pointer-events-none">
          <Play className="w-3 h-3 fill-[#20D66B] text-[#20D66B]" />
        </div>
      </div>

      {/* Info Section */}
      <div className="flex-1 min-w-0 pr-1">
        <h4 className="text-xs sm:text-base font-bold text-white group-hover:text-[#20D66B] transition-colors truncate">
          {movie.name}
        </h4>
        <p className="text-[10px] sm:text-xs text-white/50 truncate mt-0.5">
          {movie.origin_name || `${movie.year || ""}`}
        </p>

        {/* Badges & Meta */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1 sm:mt-1.5">
          {movie.quality && (
            <span className="px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded text-[8px] sm:text-[10px] font-bold bg-[#20D66B]/15 text-[#20D66B] border border-[#20D66B]/30">
              {movie.quality}
            </span>
          )}
          {movie.year && (
            <span className="text-[9px] sm:text-xs text-white/50 font-medium">
              {movie.year}
            </span>
          )}
          {movie.episode_current && (
            <span className="text-[9px] sm:text-xs text-white/40 font-medium hidden xs:inline-block">
              • {movie.episode_current}
            </span>
          )}
          {movie.category && movie.category.length > 0 && (
            <span className="text-xs text-white/40 font-medium hidden md:inline-block">
              • {movie.category.map((c) => c.name).slice(0, 2).join(", ")}
            </span>
          )}
        </div>
      </div>

      {/* Stats & Watch CTA */}
      <div className="flex items-center gap-1.5 sm:gap-5 shrink-0">
        {rating && (
          <div className="flex items-center gap-0.5 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-amber-400/10 border border-amber-400/20 text-amber-400 font-bold text-[9.5px] sm:text-xs">
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400" />
            <span>{rating}</span>
          </div>
        )}

        <div className="hidden sm:flex items-center gap-1.5 text-xs text-white/40 font-medium">
          <Eye className="w-3.5 h-3.5 text-white/30" />
          <span>{formatViews(movie.view)}</span>
        </div>

        <div className="w-6 h-6 sm:w-9 sm:h-9 rounded-full bg-white/[0.05] group-hover:bg-[#20D66B] text-white/50 group-hover:text-[#050807] border border-white/[0.08] group-hover:border-[#20D66B] flex items-center justify-center transition-all duration-200 shrink-0">
          <Play className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-current ml-0.5" />
        </div>
      </div>
    </Link>
  );
}
