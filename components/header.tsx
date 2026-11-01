"use client";

import { useState, useEffect, memo, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { Search, LayoutGrid, Smartphone, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import SearchOverlay from "@/components/search/search-overlay";
import UserMenu from "@/components/auth/user-menu";
import NotificationBell from "@/components/notifications/notification-bell";
import BrandLogo from "@/components/ui/brand-logo";
import { AnimatedSearchIcon } from "@/components/ui/animated-header-icons";
import { pipStore } from "@/lib/pip-store";
import { preconnect } from "react-dom";

interface HeaderProps {
  categories?: { slug: string; name: string }[];
  countries?: { slug: string; name: string }[];
  topics?: { slug: string; name: string }[];
}

function HeaderComponent({}: HeaderProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    preconnect("https://phimapi.com", { crossOrigin: "anonymous" });
    preconnect("https://img.phimapi.com", { crossOrigin: "anonymous" });
    preconnect("https://phimimg.com", { crossOrigin: "anonymous" });
  }, []);

  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false);
  const [activeMovieName, setActiveMovieName] = useState<string | null>(null);

  // Synchronize active movie from pipStore or custom event
  useEffect(() => {
    const unsub = pipStore.subscribe((d) => {
      if (d?.movieName) {
        setActiveMovieName(d.movieName);
      }
    });

    const handleMovieChange = (e: any) => {
      if (e.detail?.movieName) {
        setActiveMovieName(e.detail.movieName);
      }
    };
    window.addEventListener("active-movie-change", handleMovieChange);

    return () => {
      unsub();
      window.removeEventListener("active-movie-change", handleMovieChange);
    };
  }, []);

  // Synchronize fullscreen state with VideoPlayer
  useEffect(() => {
    const handleFs = (e: any) => {
      setIsPlayerFullscreen(!!e.detail?.isFullscreen);
    };
    window.addEventListener("video-fullscreen-change", handleFs);
    return () => window.removeEventListener("video-fullscreen-change", handleFs);
  }, []);

  // Synchronize state with MobileExploreSheet
  useEffect(() => {
    const handleState = (e: Event) => {
      const customEvent = e as CustomEvent<{ isOpen: boolean }>;
      if (customEvent.detail && typeof customEvent.detail.isOpen === "boolean") {
        setIsMenuOpen(customEvent.detail.isOpen);
      }
    };
    window.addEventListener("mobile-explore-state", handleState);
    return () => window.removeEventListener("mobile-explore-state", handleState);
  }, []);

  // Hotkey '/' or 'Ctrl+K' to open search overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" || (e.ctrlKey && e.key === "k")) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        e.preventDefault();
        setShowSearchOverlay(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const hasFilters = Boolean(
    searchParams?.get("category") ||
    searchParams?.get("typeList") ||
    searchParams?.get("topic") ||
    searchParams?.get("country") ||
    searchParams?.get("year") ||
    pathname.startsWith("/new-updates") ||
    pathname.startsWith("/bang-xep-hang")
  );

  const isMovieDetailPage = pathname.startsWith("/phim/");

    const handleBack = () => {
    router.push("/");
  };

  if (pathname === "/tai-app" || isPlayerFullscreen || isMovieDetailPage) {
    return null;
  }

  return (
    <>
      <header
        className={cn(
          "fixed top-0 z-[90] transition-all duration-300 select-none pointer-events-none lg:pointer-events-auto",
          // Mobile: floating wrapper with safe-area padding
          "left-0 right-0 pt-2 pt-[max(0.5rem,env(safe-area-inset-top))] px-3 pb-1",
          // Desktop: floating island top bar
          "lg:top-0 lg:left-[252px] lg:right-0 lg:pt-0 lg:pr-3 lg:pb-0 lg:pl-0 lg:bg-transparent lg:border-none lg:shadow-none"
        )}
      >
        {/* ======================================================== */}
        {/* MOBILE HEADER: Single unified floating pill bar          */}
        {/* ======================================================== */}
        <div className="lg:hidden w-full flex items-center justify-between min-w-0 pointer-events-auto h-[52px] px-2.5 sm:px-3 rounded-full bg-[#121518] border border-white/15 shadow-[0_8px_28px_rgba(0,0,0,0.85)]">
          {/* Mobile Left: Back Button or Menu Button */}
          <div className="flex items-center gap-2 pointer-events-auto shrink-0 min-w-0">
            {hasFilters ? (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Quay lại"
                title="Quay lại"
                className="relative flex items-center gap-1.5 h-[38px] px-3.5 rounded-full bg-[#1E2228] hover:bg-[#262B33] border border-white/15 hover:border-brand-green/50 shadow-[0_2px_10px_rgba(0,0,0,0.5)] active:scale-95 transition-all duration-200 cursor-pointer group shrink-0 select-none touch-manipulation"
              >
                <ChevronLeft className="w-4 h-4 text-brand-green stroke-[2.4] shrink-0" />
                <span className="text-[13px] font-extrabold text-white tracking-wide leading-none select-none">
                  Quay lại
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("toggle-mobile-explore"));
                  }
                }}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-explore-sheet"
                aria-haspopup="dialog"
                aria-label={isMenuOpen ? "Đóng menu khám phá" : "Mở menu khám phá"}
                title="Menu khám phá"
                className={cn(
                  "relative flex items-center gap-1.5 h-[38px] px-3.5 rounded-full border transition-all duration-200 cursor-pointer group shrink-0 select-none touch-manipulation overflow-hidden",
                  isMenuOpen
                    ? "bg-[#1B2A22] border-brand-green"
                    : "bg-[#1E2228] hover:bg-[#262B33] border border-white/15 hover:border-brand-green/50 shadow-[0_2px_10px_rgba(0,0,0,0.5)]",
                  "active:scale-95"
                )}
              >
                <LayoutGrid
                  className={cn(
                    "w-4 h-4 text-brand-green transition-all duration-200 shrink-0",
                    isMenuOpen ? "scale-105" : "group-hover:scale-105"
                  )}
                />
                <span
                  className={cn(
                    "text-[13px] tracking-wide leading-none select-none transition-colors",
                    isMenuOpen
                      ? "text-brand-green font-extrabold"
                      : "font-bold text-white group-hover:text-white"
                  )}
                >
                  Menu
                </span>
              </button>
            )}
          </div>

          {/* Mobile Center: Brand Logo & Movie Name */}
          <div className="flex items-center justify-center min-w-0 px-2 overflow-hidden text-center shrink-0">
            <Link
              href="/"
              className="flex items-center gap-1.5 select-none hover:opacity-85 active:scale-95 transition-all max-w-full truncate"
              aria-label="Về trang chủ Hi Phim"
            >
              <BrandLogo size="md" showSlogan={false} />
              {activeMovieName && (
                <>
                  <span className="text-white/20 select-none font-light shrink-0">|</span>
                  <span className="text-white/90 font-bold truncate text-[11.5px] max-w-[105px] xs:max-w-[150px]">
                    {activeMovieName}
                  </span>
                </>
              )}
            </Link>
          </div>

          {/* Mobile Right: Search & Notification */}
          <div className="flex items-center gap-2 pointer-events-auto shrink-0">
            <button
              onClick={() => setShowSearchOverlay(true)}
              className="relative flex items-center justify-between h-[38px] px-3.5 rounded-full bg-[#1E2228] hover:bg-[#262B33] border border-white/15 hover:border-brand-green/50 text-white transition-all duration-300 cursor-pointer group shadow-[0_4px_24px_rgba(0,0,0,0.7)] active:scale-95 shrink-0 overflow-hidden"
              aria-label="Tìm kiếm phim"
            >
              <div className="flex items-center gap-2 z-10 min-w-0">
                <AnimatedSearchIcon size={17} />
                <span className="text-white/60 group-hover:text-white/90 font-medium text-[12.5px] whitespace-nowrap">
                  Tìm kiếm...
                </span>
              </div>
            </button>
            <NotificationBell />
          </div>
        </div>

        {/* ======================================================== */}
        {/* DESKTOP HEADER: 3 BENTO ISLAND BOXES (3 Ô BO TRÒN RIÊNG) */}
        {/* ======================================================== */}
        <div className="hidden lg:flex w-full items-center justify-between pointer-events-none">
          {/* Ô 1: TÌM KIẾM (Search Bento Island) */}
          <div className="pointer-events-auto flex items-center h-[50px] px-3.5 rounded-b-2xl bg-[#0B100E]/95 backdrop-blur-xl border-x border-b border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.65)] hover:border-brand-green/40 transition-all duration-200 group">
            <button
              type="button"
              onClick={() => setShowSearchOverlay(true)}
              className="relative flex items-center justify-between h-full w-64 xl:w-72 text-white/70 hover:text-white transition-colors cursor-pointer"
              aria-label="Tìm kiếm phim, diễn viên..."
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <AnimatedSearchIcon size={16} />
                <span className="text-[12.5px] font-medium text-white/50 group-hover:text-white/80 select-none truncate">
                  Tìm kiếm phim, diễn viên...
                </span>
              </div>
              <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-brand-green/10 border border-brand-green/30 text-[9.5px] text-brand-green font-mono font-bold uppercase shadow-[0_0_8px_rgba(32,214,107,0.15)] group-hover:bg-brand-green/20 group-hover:border-brand-green/60 transition-all shrink-0 ml-2">
                <span>Ctrl</span>K
              </kbd>
            </button>
          </div>

          {/* Ô 2: LOGO (Center Logo Bento Island) */}
          <div className="pointer-events-auto flex items-center h-[50px] px-3 bg-transparent border-none shadow-none transition-all duration-200 group">
            <Link
              href="/"
              className="flex items-center gap-2 select-none hover:opacity-90 active:scale-95 transition-all max-w-full truncate"
              aria-label="Về trang chủ Hi Phim"
            >
              <BrandLogo size="md" showSlogan={false} />
              {activeMovieName && (
                <>
                  <span className="text-white/20 select-none font-light shrink-0">|</span>
                  <span className="text-white/90 font-bold truncate text-[12.5px] max-w-[150px] xl:max-w-[220px]">
                    {activeMovieName}
                  </span>
                </>
              )}
            </Link>
          </div>

          {/* Ô 3: 2 CÁI CÒN LẠI (Notification Bell + User Menu Bento Island) */}
          <div className="pointer-events-auto flex items-center gap-2.5 h-[50px] px-3 rounded-b-2xl bg-[#0B100E]/95 backdrop-blur-xl border-x border-b border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.65)] hover:border-white/15 transition-all duration-200">
            <NotificationBell />
            <div className="h-4 w-px bg-white/10 shrink-0" />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Fullscreen Search Overlay */}
      <SearchOverlay
        isOpen={showSearchOverlay}
        onClose={() => setShowSearchOverlay(false)}
      />
    </>
  );
}

const MemoizedHeaderComponent = memo(HeaderComponent);

export default function Header(props: HeaderProps) {
  return (
    <Suspense fallback={null}>
      <MemoizedHeaderComponent {...props} />
    </Suspense>
  );
}

