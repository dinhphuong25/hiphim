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
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
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
          // Desktop: docked top bar
          "lg:p-0 lg:left-[225px] lg:right-0 lg:h-16 lg:bg-cinema-sub lg:border-b lg:border-white/10 lg:shadow-none"
        )}
      >
        <div
          className={cn(
            "w-full max-w-[1700px] mx-auto flex items-center justify-between min-w-0 pointer-events-auto transition-all duration-300",
            // Mobile: floating rounded pill bar matching mobile app screenshot
            "h-[52px] px-2.5 sm:px-3 rounded-full bg-[#0B100E]/95 backdrop-blur-2xl border border-white/12 shadow-[0_4px_20px_rgba(0,0,0,0.5)]",
            // Desktop: standard container
            "lg:h-full lg:px-6 lg:px-8 lg:rounded-none lg:bg-transparent lg:border-none lg:shadow-none lg:backdrop-blur-none"
          )}
        >
          {/* Left Group: Mobile Back Button (< Quay lại) or Menu Button [⊞ Menu] + Desktop Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-2.5 pointer-events-auto shrink min-w-0">
            {hasFilters ? (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Quay lại"
                title="Quay lại"
                className="lg:hidden relative flex items-center gap-1.5 h-[38px] px-3.5 rounded-full bg-[#14231b]/85 hover:bg-[#151D19] border border-brand-green/35 hover:border-brand-green/50 active:border-brand-green/60 shadow-[0_2px_10px_rgba(0,0,0,0.5)] active:scale-95 transition-all duration-200 cursor-pointer group shrink-0 select-none touch-manipulation"
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
                  "lg:hidden relative flex items-center gap-1.5 h-[38px] px-3.5 rounded-full border transition-all duration-200 cursor-pointer group shrink-0 select-none touch-manipulation overflow-hidden",
                  // Active / Open State vs Default State
                  isMenuOpen
                    ? "bg-[#14231b] border-brand-green"
                    : "bg-[#14231b]/85 hover:bg-[#151D19] border-brand-green/35 hover:border-brand-green/50 active:border-brand-green/60 shadow-[0_2px_10px_rgba(0,0,0,0.5)]",
                  "active:scale-95"
                )}
              >
                {/* 4-square Grid Icon — Hi Phim Emerald */}
                <LayoutGrid
                  className={cn(
                    "w-4 h-4 text-brand-green transition-all duration-200 shrink-0",
                    isMenuOpen ? "scale-105" : "group-hover:scale-105"
                  )}
                />

                {/* Menu Text */}
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

            {/* Brand Logo only on Desktop */}
            <div className="hidden lg:flex items-center">
              <Link
                href="/"
                className="flex items-center select-none group shrink-0 min-w-0"
                aria-label="Về trang chủ Hi Phim"
              >
                <BrandLogo size="md" />
              </Link>
            </div>
          </div>

          {/* Center Group on Mobile: Brand Logo & Movie Name (Hidden when hasFilters on mobile to match Screenshot 2) */}
          {!hasFilters && (
            <div className="lg:hidden flex items-center justify-center min-w-0 flex-1 px-1.5 overflow-hidden text-center">
              <Link
                href="/"
                className="flex items-center gap-1.5 select-none hover:opacity-85 active:scale-95 transition-all max-w-full truncate"
                aria-label="Về trang chủ Hi Phim"
              >
                <BrandLogo size="sm" showSlogan={false} />
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
          )}

          {/* Right Action Cluster: Search bar + Desktop User Profile / Login */}
          <div className="flex items-center gap-2 sm:gap-2.5 pointer-events-auto shrink-0">
            {/* Search Trigger Button - Full Pill matching mobile app */}
            <button
              onClick={() => setShowSearchOverlay(true)}
              className={cn(
                "relative flex items-center justify-between transition-all duration-300 cursor-pointer group shadow-[0_4px_24px_rgba(0,0,0,0.7)] active:scale-95 shrink-0 overflow-hidden",
                // Mobile: pill matching app
                "h-[38px] px-3.5 rounded-full bg-white/[0.06] border border-white/10 hover:border-brand-green/40 backdrop-blur-xl text-white",
                // Desktop: standard input look
                "lg:h-10 lg:pl-2 lg:pr-2.5 lg:w-52 lg:bg-[#111714] lg:hover:bg-[#151D19] lg:border-white/10 lg:hover:border-brand-green/50"
              )}
              aria-label="Tìm kiếm phim"
            >
              {/* Search Pill Content */}
              <div className="flex items-center gap-2 z-10 min-w-0">
                <AnimatedSearchIcon size={17} />
                <span className="text-white/60 group-hover:text-white/90 font-medium text-[12.5px] whitespace-nowrap">
                  Tìm kiếm...
                </span>
              </div>

              <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-brand-green/10 border border-brand-green/30 text-[9.5px] text-brand-green font-mono font-bold uppercase shadow-[0_0_8px_rgba(32,214,107,0.15)] group-hover:bg-brand-green/20 group-hover:border-brand-green/60 transition-all shrink-0 z-10 ml-2">
                <span className="text-[9.5px]">Ctrl</span>K
              </kbd>
            </button>

            {/* Notification Bell (Episode reports & Admin alerts) */}
            <NotificationBell />

            {/* User Profile / Admin Control — Hidden on mobile since it's in the bottom nav dock */}
            <div className="hidden lg:flex items-center shrink-0">
              <UserMenu />
            </div>
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

