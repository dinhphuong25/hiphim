"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  X,
  Home,
  Clapperboard,
  Tv,
  Film,
  Cat,
  RefreshCw,
  Trophy,
  Layers,
  Globe,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { instantMovieStore } from "@/lib/instant-movie-store";

interface MobileExploreSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCategories: () => void;
  onOpenCountries: () => void;
  onOpenYears: () => void;
  categoriesCount?: number;
  countriesCount?: number;
}

interface ExploreCard {
  id: string;
  label: string;
  href?: string;
  action?: "categories" | "countries" | "years";
  solidBg: string;
  bgClass: string;
  borderClass: string;
  iconBox: string;
  iconColor: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  image: string;
  typeList?: string;
}

export default function MobileExploreSheet({
  isOpen,
  onClose,
  onOpenCategories,
  onOpenCountries,
  onOpenYears,
}: MobileExploreSheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);

  // 10 Balanced Cards (5 Pairs) — Designed to match the Onflix mobile discovery UI
  const CARDS: ExploreCard[] = [
    {
      id: "home",
      label: "Trang Chủ",
      href: "/",
      solidBg: "#072417",
      bgClass: "bg-[#072417]",
      borderClass: "border-emerald-500/30 hover:border-emerald-400/60",
      iconBox: "bg-emerald-500/15 border-emerald-500/25",
      iconColor: "text-emerald-400",
      icon: Home,
      image: "https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "phim-chieu-rap",
      label: "Chiếu Rạp",
      href: "/?typeList=phim-chieu-rap",
      typeList: "phim-chieu-rap",
      solidBg: "#2c0b11",
      bgClass: "bg-[#2c0b11]",
      borderClass: "border-rose-500/30 hover:border-rose-400/60",
      iconBox: "bg-rose-500/15 border-rose-500/25",
      iconColor: "text-rose-400",
      icon: Clapperboard,
      image: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "phim-bo",
      label: "Phim Bộ",
      href: "/?typeList=phim-bo",
      typeList: "phim-bo",
      solidBg: "#0b1c36",
      bgClass: "bg-[#0b1c36]",
      borderClass: "border-sky-500/30 hover:border-sky-400/60",
      iconBox: "bg-sky-500/15 border-sky-500/25",
      iconColor: "text-sky-400",
      icon: Tv,
      image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "phim-le",
      label: "Phim Lẻ",
      href: "/?typeList=phim-le",
      typeList: "phim-le",
      solidBg: "#082619",
      bgClass: "bg-[#082619]",
      borderClass: "border-emerald-500/30 hover:border-emerald-400/60",
      iconBox: "bg-emerald-500/15 border-emerald-500/25",
      iconColor: "text-emerald-400",
      icon: Film,
      image: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "hoat-hinh",
      label: "Hoạt Hình",
      href: "/?typeList=hoat-hinh",
      typeList: "hoat-hinh",
      solidBg: "#2c1806",
      bgClass: "bg-[#2c1806]",
      borderClass: "border-amber-500/30 hover:border-amber-400/60",
      iconBox: "bg-amber-500/15 border-amber-500/25",
      iconColor: "text-amber-400",
      icon: Cat,
      image: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "new-updates",
      label: "Mới Cập Nhật",
      href: "/new-updates",
      solidBg: "#082424",
      bgClass: "bg-[#082424]",
      borderClass: "border-teal-500/30 hover:border-teal-400/60",
      iconBox: "bg-teal-500/15 border-teal-500/25",
      iconColor: "text-teal-400",
      icon: RefreshCw,
      image: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "bang-xep-hang",
      label: "Bảng Xếp Hạng",
      href: "/bang-xep-hang",
      solidBg: "#240b38",
      bgClass: "bg-[#240b38]",
      borderClass: "border-purple-500/30 hover:border-purple-400/60",
      iconBox: "bg-purple-500/15 border-purple-500/25",
      iconColor: "text-purple-400",
      icon: Trophy,
      image: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "categories",
      label: "Thể Loại",
      action: "categories",
      solidBg: "#2b1208",
      bgClass: "bg-[#2b1208]",
      borderClass: "border-orange-500/30 hover:border-orange-400/60",
      iconBox: "bg-orange-500/15 border-orange-500/25",
      iconColor: "text-orange-400",
      icon: Layers,
      image: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "countries",
      label: "Quốc Gia",
      action: "countries",
      solidBg: "#0c163b",
      bgClass: "bg-[#0c163b]",
      borderClass: "border-indigo-500/30 hover:border-indigo-400/60",
      iconBox: "bg-indigo-500/15 border-indigo-500/25",
      iconColor: "text-indigo-400",
      icon: Globe,
      image: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&auto=format&fit=crop&q=80",
    },
    {
      id: "years",
      label: "Năm Phát Hành",
      action: "years",
      solidBg: "#26150b",
      bgClass: "bg-[#26150b]",
      borderClass: "border-amber-600/30 hover:border-amber-500/60",
      iconBox: "bg-amber-600/15 border-amber-600/25",
      iconColor: "text-amber-400",
      icon: Calendar,
      image: "https://images.unsplash.com/photo-1501139083538-0139583c060f?w=400&auto=format&fit=crop&q=80",
    },
  ];

  // Lock body scroll when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY !== null) {
      const touchEndY = e.changedTouches[0].clientY;
      if (touchEndY - touchStartY > 60) {
        onClose();
      }
    }
    setTouchStartY(null);
  };

  return (
    <div
      className="lg:hidden fixed inset-0 z-[150] flex items-end justify-center select-none animate-in fade-in duration-200"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/85 backdrop-blur-md" />

      {/* Bottom Sheet Container */}
      <div
        id="mobile-explore-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="Menu khám phá danh mục"
        onClick={(e) => e.stopPropagation()}
        className="relative z-10 w-full max-h-[90dvh] sm:max-h-[85vh] flex flex-col bg-[#0c120f] border-t border-white/12 rounded-t-[28px] sm:rounded-t-[32px] shadow-[0_-16px_56px_rgba(0,0,0,0.95)] overflow-hidden animate-in slide-in-from-bottom duration-250 ease-out"
      >
        {/* Pull Handle Header (Supports swipe down to dismiss) */}
        <div
          className="pt-2.5 pb-1 flex flex-col items-center justify-center shrink-0 cursor-pointer touch-manipulation"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onClick={onClose}
        >
          <div className="w-11 h-1.5 rounded-full bg-white/20 active:bg-white/40 transition-colors" />
        </div>

        {/* Sheet Header — Onflix Style */}
        <div
          className="flex items-center justify-between px-5 pt-1 pb-3.5 border-b border-white/[0.08] shrink-0"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-none">
            Khám Phá
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center transition-colors cursor-pointer active:scale-95 shrink-0"
            aria-label="Đóng bảng Khám Phá"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Scrollable Cards Grid Container */}
        <div
          ref={scrollRef}
          className="relative z-10 flex-1 overflow-y-auto modal-scroll custom-scrollbar overscroll-contain -webkit-overflow-scrolling-touch p-3 sm:p-4 pb-2"
        >
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
            {CARDS.map((card) => {
              const cardContent = (
                <div
                  className={cn(
                    "relative overflow-hidden rounded-2xl border h-[62px] sm:h-[66px] flex items-center px-3 group active:scale-[0.97] transition-all duration-200 cursor-pointer shadow-[0_4px_16px_rgba(0,0,0,0.5)] select-none",
                    card.bgClass,
                    card.borderClass
                  )}
                >
                  {/* Right Side Fading Character Artwork */}
                  <div className="absolute right-0 top-0 bottom-0 w-[55%] pointer-events-none select-none overflow-hidden">
                    <Image
                      src={card.image}
                      alt=""
                      fill
                      unoptimized
                      className="object-cover object-center group-hover:scale-108 transition-transform duration-500"
                      sizes="200px"
                    />

                    {/* Gradient Fade: Solid card color on the left to transparent on the right */}
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `linear-gradient(to right, ${card.solidBg} 0%, ${card.solidBg}e6 18%, ${card.solidBg}40 55%, transparent 90%)`,
                      }}
                    />

                    {/* Depth Vignette */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />
                  </div>

                  {/* Left Side Content: Icon + Clear Bold Title */}
                  <div className="relative z-10 flex items-center gap-2.5 min-w-0 pr-1 select-none">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border transition-transform duration-200 group-hover:scale-108",
                        card.iconBox
                      )}
                    >
                      <card.icon className={cn("w-4 h-4", card.iconColor)} strokeWidth={2} />
                    </div>

                    <span className="font-bold text-[13.5px] sm:text-[14.5px] text-white tracking-tight truncate leading-tight group-hover:text-brand-green transition-colors">
                      {card.label}
                    </span>
                  </div>
                </div>
              );

              if (card.action) {
                return (
                  <button
                    key={card.id}
                    type="button"
                    onClick={() => {
                      onClose();
                      if (card.action === "categories") onOpenCategories();
                      if (card.action === "countries") onOpenCountries();
                      if (card.action === "years") onOpenYears();
                    }}
                    className="w-full text-left"
                  >
                    {cardContent}
                  </button>
                );
              }

              return (
                <Link
                  key={card.id}
                  href={card.href || "/"}
                  scroll={false}
                  onClick={onClose}
                  onTouchStart={() => {
                    if (card.typeList) instantMovieStore.prefetch(card.typeList);
                  }}
                  onMouseEnter={() => {
                    if (card.typeList) instantMovieStore.prefetch(card.typeList);
                  }}
                  className="w-full"
                >
                  {cardContent}
                </Link>
              );
            })}
          </div>

          {/* Bottom subtle divider & swipe to close hint */}
          <div className="mt-3 pt-3 pb-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] border-t border-white/[0.08] flex items-center justify-center shrink-0">
            <span className="text-[12px] font-medium text-white/40 tracking-wide select-none">
              Kéo xuống để đóng
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
