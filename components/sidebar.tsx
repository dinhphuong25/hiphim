"use client";

import { useState, useEffect, useMemo, useRef, startTransition, Suspense, memo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useUserAuth } from "@/context/user-auth-context";
import { toast } from "sonner";
import {
  Home,
  Tv,
  Film,
  Clapperboard,
  Flame,
  Clock,
  History,
  Heart,
  Cat,
  Globe,
  X,
  Menu,
  ChevronDown,
  Sparkles,
  ChevronRight,
  RotateCcw,
  Layers,
  Search,
  Check,
  Calendar,
  User,
  LogIn,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Crown,
  Shield,
  Users,
  Settings,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Smartphone,
  Download,
  AlertTriangle,
  Bell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sortCountriesByPopularity, getCountryCode, POPULAR_COUNTRIES } from "@/lib/countries";
import { getCategoryEmoji, sortCategoriesByPopularity, POPULAR_CATEGORIES } from "@/lib/categories";
import { instantMovieStore } from "@/lib/instant-movie-store";
import MobileExploreSheet from "@/components/navigation/mobile-explore-sheet";
import BrandLogo from "@/components/ui/brand-logo";
import { useNavigationTab } from "@/context/navigation-tab-context";
import { SidebarAnimatedIcon, type SidebarIconType } from "@/components/ui/animated-sidebar-icons";

interface SidebarProps {
  categories?: { slug: string; name: string }[];
  countries?: { slug: string; name: string }[];
}

interface NavMainItem {
  href: string;
  label: string;
  iconType: SidebarIconType;
  typeList?: string;
}

const NAV_MAIN: NavMainItem[] = [
  { href: "/", label: "Trang Chủ", iconType: "home" },
  { href: "/?typeList=phim-chieu-rap", label: "Chiếu Rạp", iconType: "clapperboard", typeList: "phim-chieu-rap" },
  { href: "/?typeList=phim-bo", label: "Phim Bộ", iconType: "tv", typeList: "phim-bo" },
  { href: "/?typeList=phim-le", label: "Phim Lẻ", iconType: "film", typeList: "phim-le" },
  { href: "/?typeList=hoat-hinh", label: "Hoạt Hình", iconType: "cat", typeList: "hoat-hinh" },
  { href: "/new-updates", label: "Mới Cập Nhật", iconType: "refresh" },
];

interface NavPersonalItem {
  href: string;
  label: string;
  iconType: SidebarIconType;
}

const NAV_PERSONAL: NavPersonalItem[] = [
  { href: "/recently", label: "Lịch Sử Xem", iconType: "history" },
  { href: "/favorites", label: "Phim Yêu Thích", iconType: "heart" },
];

function SidebarMainNavItem({
  item,
  active,
  onClick,
  onPrefetch,
}: {
  item: NavMainItem;
  active: boolean;
  onClick: () => void;
  onPrefetch?: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={item.href}
      scroll={false}
      prefetch={true}
      onClick={onClick}
      onMouseEnter={() => {
        setIsHovered(true);
        onPrefetch?.();
      }}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={onPrefetch}
      className={cn(
        "relative flex items-center gap-3 lg:gap-2.5 px-3 lg:px-2.5 py-2 lg:py-2 rounded-xl text-sm lg:text-[13px] font-medium lg:font-semibold transition-all duration-150 group overflow-hidden border",
        active
          ? "bg-brand-green/15 text-brand-green border-brand-green/30 shadow-[0_0_12px_rgba(32,214,107,0.15)] font-semibold"
          : "text-white/65 hover:text-white hover:bg-white/[0.06] border-transparent"
      )}
      aria-current={active ? "page" : undefined}
    >
      <SidebarAnimatedIcon
        type={item.iconType}
        isHovered={isHovered}
        isActive={active}
        className={cn(
          "w-[18px] h-[18px] lg:w-4 lg:h-4 shrink-0 transition-colors duration-150",
          active ? "text-brand-green" : "text-white/60 group-hover:text-white"
        )}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SidebarPersonalNavItem({
  item,
  active,
  onClick,
}: {
  item: NavPersonalItem;
  active: boolean;
  onClick: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Link
      href={item.href}
      prefetch={true}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "w-full relative flex items-center gap-3 lg:gap-2.5 px-3 lg:px-2.5 py-2 lg:py-2 rounded-xl text-sm lg:text-[13px] font-medium lg:font-semibold transition-all duration-150 group overflow-hidden text-left cursor-pointer border",
        active
          ? "bg-brand-green/15 text-brand-green border-brand-green/30 shadow-[0_0_12px_rgba(32,214,107,0.15)] font-semibold"
          : "text-white/65 hover:text-white hover:bg-white/[0.06] border-transparent"
      )}
      aria-current={active ? "page" : undefined}
    >
      <SidebarAnimatedIcon
        type={item.iconType}
        isHovered={isHovered}
        isActive={active}
        className={cn(
          "w-[18px] h-[18px] lg:w-4 lg:h-4 shrink-0 transition-colors duration-150",
          active ? "text-brand-green" : "text-white/60 group-hover:text-white"
        )}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SidebarContent({
  categories: propCategories = [],
  countries: propCountries = [],
}: SidebarProps) {
  const { user, openAuthModal, logout, syncWithServer } = useUserAuth();
  const isSuperAdmin = Boolean(
    user && (user.role === "superadmin" || user.role === "admin" || user.email?.toLowerCase() === "kimdinhphuong205@gmail.com")
  );
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { activeTab, setActiveTab, navigateToTab } = useNavigationTab();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isExploreOpen, setIsExploreOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isPlayerFullscreen, setIsPlayerFullscreen] = useState(false);
  const [isCategoryHovered, setIsCategoryHovered] = useState(false);
  const [isCountryHovered, setIsCountryHovered] = useState(false);
  const [isYearHovered, setIsYearHovered] = useState(false);
  const [isAppHovered, setIsAppHovered] = useState(false);

  // Check if current route is movie detail page (/phim/[slug]) on mobile
  const isMovieDetailPage = Boolean(pathname && pathname.startsWith("/phim/"));
  const [isDetailNavCollapsed, setIsDetailNavCollapsed] = useState(false);

  // Auto-collapse immediately with clear entrance animation on movie detail page
  useEffect(() => {
    if (isMovieDetailPage) {
      setIsDetailNavCollapsed(false);
      // Wait 300ms so initial frame is rendered, then trigger visible slide-down animation
      const timer = setTimeout(() => {
        setIsDetailNavCollapsed(true);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setIsDetailNavCollapsed(false);
    }
  }, [isMovieDetailPage, pathname]);

  // Auto-collapse when scrolling down on movie detail page
  useEffect(() => {
    if (!isMovieDetailPage) return;

    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY + 30 && !isDetailNavCollapsed) {
        setIsDetailNavCollapsed(true);
      }
      lastScrollY = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMovieDetailPage, isDetailNavCollapsed]);

  useEffect(() => {
    const handleFs = (e: any) => {
      setIsPlayerFullscreen(!!e.detail?.isFullscreen);
    };
    window.addEventListener('video-fullscreen-change', handleFs);
    return () => window.removeEventListener('video-fullscreen-change', handleFs);
  }, []);

  // Active selection modal: 'categories' | 'countries' | 'years' | null
  const [activeModal, setActiveModal] = useState<"categories" | "countries" | "years" | null>(null);
  const [categorySearchQuery, setCategorySearchQuery] = useState("");
  const [countrySearchQuery, setCountrySearchQuery] = useState("");
  const [yearSearchQuery, setYearSearchQuery] = useState("");
  const [yearDecade, setYearDecade] = useState<"all" | "2020s" | "2010s" | "2000s" | "classic">("all");
  const [categoryThematicFilter, setCategoryThematicFilter] = useState<"all" | "popular" | "action" | "romance" | "anime">("all");
  const [countryRegionFilter, setCountryRegionFilter] = useState<"all" | "popular" | "asia" | "west">("all");

  // Listen for open/toggle explore events from mobile header Menu button
  useEffect(() => {
    const handleOpenExplore = () => {
      setIsExploreOpen(true);
      setIsMobileOpen(false);
      setIsAccountOpen(false);
      setActiveModal(null);
    };
    const handleToggleExplore = () => {
      setIsExploreOpen((prev) => {
        const next = !prev;
        if (next) {
          setIsMobileOpen(false);
          setIsAccountOpen(false);
          setActiveModal(null);
        }
        return next;
      });
    };
    window.addEventListener("open-mobile-explore", handleOpenExplore);
    window.addEventListener("toggle-mobile-explore", handleToggleExplore);
    return () => {
      window.removeEventListener("open-mobile-explore", handleOpenExplore);
      window.removeEventListener("toggle-mobile-explore", handleToggleExplore);
    };
  }, []);

  // Broadcast explore state changes to sync with mobile header Menu button
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("mobile-explore-state", { detail: { isOpen: isExploreOpen } })
      );
    }
  }, [isExploreOpen]);

  const modalScrollRef = useRef<HTMLDivElement>(null);
  const [modalScrolled, setModalScrolled] = useState(false);

  useEffect(() => {
    setModalScrolled(false);
  }, [activeModal]);

  const handleModalScrollToggle = () => {
    if (!modalScrollRef.current) return;
    if (modalScrolled) {
      modalScrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      modalScrollRef.current.scrollTo({
        top: modalScrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // Scroll container refs for selection modals
  const categoriesScrollRef = useRef<HTMLDivElement>(null);
  const countriesScrollRef = useRef<HTMLDivElement>(null);
  const yearsScrollRef = useRef<HTMLDivElement>(null);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await syncWithServer();
    setIsSyncing(false);
    toast.success("Đã đồng bộ phim yêu thích & lịch sử xem!");
  };

  const [categories, setCategories] = useState<{ slug: string; name: string }[]>(() => {
    if (Array.isArray(propCategories) && propCategories.length > 0) return propCategories;
    const items = (propCategories as any)?.items || (propCategories as any)?.data;
    return Array.isArray(items) ? items : [];
  });

  const [countries, setCountries] = useState<{ slug: string; name: string }[]>(() => {
    if (Array.isArray(propCountries) && propCountries.length > 0) return propCountries;
    const items = (propCountries as any)?.items || (propCountries as any)?.data;
    return Array.isArray(items) ? items : [];
  });

  // Client-side fallback fetch if props were empty
  useEffect(() => {
    if (categories.length === 0 || countries.length === 0) {
      import("@/libs/phimapi.com").then(({ default: PhimApi }) => {
        const api = new PhimApi();
        if (categories.length === 0) {
          api.listCategories().then((res) => {
            if (Array.isArray(res) && res.length > 0) setCategories(res);
          }).catch(() => {});
        }
        if (countries.length === 0) {
          api.listCountries().then((res) => {
            if (Array.isArray(res) && res.length > 0) setCountries(res);
          }).catch(() => {});
        }
      });
    }
  }, [categories.length, countries.length]);

  // Close modals and mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
    setIsExploreOpen(false);
    setActiveModal(null);
    setCategorySearchQuery("");
    setCountrySearchQuery("");
    setYearSearchQuery("");
    setYearDecade("all");
    setCategoryThematicFilter("all");
    setCountryRegionFilter("all");
  }, [pathname, searchParams]);

  // Prefetch mobile bottom nav routes for instant 0ms transition on single tap
  useEffect(() => {
    router.prefetch("/");
    router.prefetch("/recently");
    router.prefetch("/favorites");
  }, [router]);

  const handleBottomNavNavigate = (href: string, e?: React.MouseEvent) => {
    setIsMobileOpen(false);
    setIsAccountOpen(false);
    setIsExploreOpen(false);
    setActiveModal(null);
    setCategorySearchQuery("");
    setCountrySearchQuery("");
    setYearSearchQuery("");
    setYearDecade("all");
    setCategoryThematicFilter("all");
    setCountryRegionFilter("all");

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    navigateToTab(href);

    if (pathname === href && !hasActiveFilters) {
      if (e) e.preventDefault();
    }
  };

  // Listen for Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveModal(null);
        setIsAccountOpen(false);
      }
    };
    if (activeModal) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [activeModal]);

  const currentCategory = searchParams.get("category");
  const currentCountry = searchParams.get("country");
  const currentYear = searchParams.get("year");
  const currentTypeList = searchParams.get("typeList") || searchParams.get("typelist");
  const hasActiveFilters = Boolean(
    currentTypeList ||
    currentCountry ||
    currentCategory ||
    currentYear ||
    searchParams.get("topic") ||
    searchParams.get("q")
  );

  // Find active names
  const activeCategoryObj = useMemo(() => {
    return categories.find((c) => c.slug === currentCategory);
  }, [categories, currentCategory]);

  const activeCountryObj = useMemo(() => {
    return countries.find((c) => c.slug === currentCountry);
  }, [countries, currentCountry]);

  const isLinkActive = (href: string, typeList?: string) => {
    if (typeList) {
      return pathname === "/" && (currentTypeList === typeList || searchParams.get("typelist") === typeList);
    }
    if (href === "/") {
      return pathname === "/" && !hasActiveFilters;
    }
    return pathname.startsWith(href);
  };

  const currentActiveTab = useMemo(() => {
    if (isAccountOpen) return "account";
    if (pathname === "/recently" || activeTab === "/recently") return "/recently";
    if (pathname === "/favorites" || activeTab === "/favorites") return "/favorites";
    if (pathname === "/tai-app" || activeTab === "/tai-app") return "/tai-app";
    if (activeTab) return activeTab;
    if (pathname === "/" && !hasActiveFilters) return "/";
    return null;
  }, [isAccountOpen, activeTab, pathname, hasActiveFilters]);

  const sortedCountries = useMemo(() => {
    return sortCountriesByPopularity(countries);
  }, [countries]);

  const currentYearNum = new Date().getFullYear();
  const YEARS_LIST = useMemo(() => {
    return Array.from(
      { length: currentYearNum - 1980 + 1 },
      (_, i) => currentYearNum - i
    );
  }, [currentYearNum]);

  const filteredCategories = useMemo(() => {
    if (!categorySearchQuery.trim()) return categories;
    return categories.filter((c) =>
      c.name.toLowerCase().includes(categorySearchQuery.toLowerCase())
    );
  }, [categories, categorySearchQuery]);

  const displayedCategories = useMemo(() => {
    if (categorySearchQuery.trim()) return filteredCategories;
    if (categoryThematicFilter === "popular") {
      const popularSlugs = new Set(["hanh-dong", "co-trang", "tinh-cam", "kinh-di", "hai-huoc", "vien-tuong", "hoat-hinh", "tam-ly", "vo-thuat", "hinh-su", "phieu-luu", "gia-dinh"]);
      return categories.filter((c) => popularSlugs.has(c.slug));
    }
    if (categoryThematicFilter === "action") {
      const slugs = new Set(["hanh-dong", "vo-thuat", "vien-tuong", "khoa-hoc-vien-tuong", "hinh-su", "phieu-luu", "chien-tranh", "gay-can", "kich-tinh", "kinh-di"]);
      return categories.filter((c) => slugs.has(c.slug) || c.name.toLowerCase().includes("hành động") || c.name.toLowerCase().includes("võ thuật"));
    }
    if (categoryThematicFilter === "romance") {
      const slugs = new Set(["tinh-cam", "co-trang", "tam-ly", "gia-dinh", "hoc-duong", "hai-huoc", "am-nhac", "chinh-kich"]);
      return categories.filter((c) => slugs.has(c.slug) || c.name.toLowerCase().includes("tình cảm") || c.name.toLowerCase().includes("cổ trang"));
    }
    if (categoryThematicFilter === "anime") {
      const slugs = new Set(["hoat-hinh", "anime", "than-thoai", "bi-an", "tai-lieu", "the-thao", "lich-su", "mien-tay", "phim-18"]);
      return categories.filter((c) => slugs.has(c.slug) || c.name.toLowerCase().includes("hoạt hình") || c.name.toLowerCase().includes("thần thoại"));
    }
    return categories;
  }, [categories, categorySearchQuery, filteredCategories, categoryThematicFilter]);

  const filteredCountries = useMemo(() => {
    if (!countrySearchQuery.trim()) return sortedCountries;
    return sortedCountries.filter((c) =>
      c.name.toLowerCase().includes(countrySearchQuery.toLowerCase())
    );
  }, [sortedCountries, countrySearchQuery]);

  const displayedCountries = useMemo(() => {
    if (countrySearchQuery.trim()) return filteredCountries;
    if (countryRegionFilter === "popular") {
      const popularSlugs = new Set(["trung-quoc", "han-quoc", "au-my", "nhat-ban", "thai-lan", "viet-nam", "hong-kong", "an-do", "dai-loan", "phap", "anh", "duc"]);
      return sortedCountries.filter((c) => popularSlugs.has(c.slug));
    }
    if (countryRegionFilter === "asia") {
      const asiaSlugs = new Set(["trung-quoc", "han-quoc", "nhat-ban", "thai-lan", "viet-nam", "hong-kong", "an-do", "dai-loan", "tai-wan", "philippines", "malaysia", "indonesia", "singapore", "tho-nhi-ky", "trieu-tien", "campuchia", "lao", "myanmar"]);
      return sortedCountries.filter((c) => asiaSlugs.has(c.slug) || ["CN", "KR", "JP", "VN", "TH", "HK", "IN", "TW"].includes(getCountryCode(c.slug) || ""));
    }
    if (countryRegionFilter === "west") {
      const westSlugs = new Set(["au-my", "phap", "anh", "duc", "tay-ban-nha", "canada", "uc", "y", "nga", "na-uy", "thuy-dien", "ha-lan", "ba-lan", "bi", "thuy-si", "dan-mach", "brazil", "mexico"]);
      return sortedCountries.filter((c) => westSlugs.has(c.slug) || !["trung-quoc", "han-quoc", "nhat-ban", "thai-lan", "viet-nam", "hong-kong", "an-do", "dai-loan"].includes(c.slug));
    }
    return sortedCountries;
  }, [sortedCountries, countrySearchQuery, filteredCountries, countryRegionFilter]);

  const filteredYears = useMemo(() => {
    if (!yearSearchQuery.trim()) return YEARS_LIST;
    return YEARS_LIST.filter((y) => String(y).includes(yearSearchQuery.trim()));
  }, [YEARS_LIST, yearSearchQuery]);

  const displayedYears = useMemo(() => {
    if (yearSearchQuery.trim()) return filteredYears;
    if (yearDecade === "2020s") return filteredYears.filter((y) => y >= 2020);
    if (yearDecade === "2010s") return filteredYears.filter((y) => y >= 2010 && y <= 2019);
    if (yearDecade === "2000s") return filteredYears.filter((y) => y >= 2000 && y <= 2009);
    if (yearDecade === "classic") return filteredYears.filter((y) => y < 2000);
    return filteredYears;
  }, [filteredYears, yearSearchQuery, yearDecade]);

  const [isClosing, setIsClosing] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);

  const closeModal = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isClosing) return;
    setActiveModal(null);
    setIsClosing(false);
    setCategorySearchQuery("");
    setCountrySearchQuery("");
    setYearSearchQuery("");
    setYearDecade("all");
    setCategoryThematicFilter("all");
    setCountryRegionFilter("all");
  };

  const handleSelectCategory = (slug: string, e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveModal(null);
    setIsMobileOpen(false);
    setIsExploreOpen(false);
    setIsSelecting(false);
    router.push(`/?category=${slug}`, { scroll: false });
  };

  const handleSelectCountry = (slug: string, e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveModal(null);
    setIsMobileOpen(false);
    setIsExploreOpen(false);
    setIsSelecting(false);
    router.push(`/?country=${slug}`, { scroll: false });
  };

  const handleSelectYear = (year: number | string, e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setActiveModal(null);
    setIsMobileOpen(false);
    setIsExploreOpen(false);
    setIsSelecting(false);
    router.push(`/?year=${year}`, { scroll: false });
  };

  return (
    <>
      {/* ======================================================== */}
      {/* MOBILE BOTTOM NAVIGATION BAR (MATCHING NATIVE APP TAB BAR) */}
      {/* ======================================================== */}
      <nav
        aria-label="Điều hướng chính"
        className={cn(
          "lg:hidden fixed bottom-0 left-0 right-0 z-[140] w-full select-none touch-manipulation pointer-events-none",
          "px-3 pb-2 pb-[max(0.6rem,env(safe-area-inset-bottom,0px))]",
          "transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] will-change-transform",
          isPlayerFullscreen && "hidden",
          isMovieDetailPage && isDetailNavCollapsed
            ? "translate-y-full opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100 pointer-events-auto"
        )}
        style={{
          transform: isMovieDetailPage && isDetailNavCollapsed ? "translate3d(0, 100%, 0)" : "translate3d(0, 0, 0)",
          WebkitTransform: isMovieDetailPage && isDetailNavCollapsed ? "translate3d(0, 100%, 0)" : "translate3d(0, 0, 0)",
        }}
      >
        <div className="w-full max-w-lg mx-auto h-[56px] flex items-center justify-between px-2 rounded-full bg-[#121518] border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,0.9)] pointer-events-auto">
          {/* Tab 1: Trang Chủ */}
          {(() => {
            const active = currentActiveTab === "/";
            return (
              <Link
                href="/"
                prefetch={true}
                onClick={(e) => handleBottomNavNavigate("/", e)}
                className="flex-1 h-full flex items-center justify-center select-none touch-manipulation active:scale-95 transition-transform"
                aria-label="Trang Chủ"
              >
                {active ? (
                  <div className="w-[88%] h-[44px] rounded-full bg-[#1B2A22] border border-brand-green/35 flex flex-col items-center justify-center gap-0.5 relative transition-colors duration-150">
                    <SidebarAnimatedIcon type="home" size={20} className="text-brand-green" isActive={true} />
                    <span className="text-[10px] font-bold text-brand-green tracking-tight leading-none">
                      Trang chủ
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 py-1 text-white/70 hover:text-white transition-colors">
                    <SidebarAnimatedIcon type="home" size={19} className="opacity-80" />
                    <span className="text-[9.5px] font-semibold tracking-tight leading-none">
                      Trang chủ
                    </span>
                  </div>
                )}
              </Link>
            );
          })()}

          {/* Tab 2: Lịch Sử */}
          {(() => {
            const active = currentActiveTab === "/recently";
            return (
              <Link
                href="/recently"
                prefetch={true}
                onClick={(e) => handleBottomNavNavigate("/recently", e)}
                className="flex-1 h-full flex items-center justify-center select-none touch-manipulation active:scale-95 transition-transform"
                aria-label="Lịch Sử Xem"
              >
                {active ? (
                  <div className="w-[88%] h-[44px] rounded-full bg-[#1B2A22] border border-brand-green/35 flex flex-col items-center justify-center gap-0.5 relative transition-colors duration-150">
                    <SidebarAnimatedIcon type="history" size={20} className="text-brand-green" isActive={true} />
                    <span className="text-[10px] font-bold text-brand-green tracking-tight leading-none">
                      Lịch sử
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 py-1 text-white/70 hover:text-white transition-colors">
                    <SidebarAnimatedIcon type="history" size={19} className="opacity-80" />
                    <span className="text-[9.5px] font-semibold tracking-tight leading-none">
                      Lịch sử
                    </span>
                  </div>
                )}
              </Link>
            );
          })()}

          {/* Tab 3: Yêu Thích */}
          {(() => {
            const active = currentActiveTab === "/favorites";
            return (
              <Link
                href="/favorites"
                prefetch={true}
                onClick={(e) => handleBottomNavNavigate("/favorites", e)}
                className="flex-1 h-full flex items-center justify-center select-none touch-manipulation active:scale-95 transition-transform"
                aria-label="Yêu Thích"
              >
                {active ? (
                  <div className="w-[88%] h-[44px] rounded-full bg-[#1B2A22] border border-brand-green/35 flex flex-col items-center justify-center gap-0.5 relative transition-colors duration-150">
                    <SidebarAnimatedIcon type="heart" size={20} className="text-brand-green" isActive={true} />
                    <span className="text-[10px] font-bold text-brand-green tracking-tight leading-none">
                      Yêu thích
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 py-1 text-white/70 hover:text-white transition-colors">
                    <SidebarAnimatedIcon type="heart" size={19} className="opacity-80" />
                    <span className="text-[9.5px] font-semibold tracking-tight leading-none">
                      Yêu thích
                    </span>
                  </div>
                )}
              </Link>
            );
          })()}

          {/* Tab 4: Tài Khoản */}
          {(() => {
            const active = isAccountOpen || currentActiveTab === "account";
            return (
              <button
                type="button"
                onClick={() => {
                  setIsExploreOpen(false);
                  setIsMobileOpen(false);
                  setActiveModal(null);
                  if (user) {
                    setIsAccountOpen((prev) => !prev);
                  } else {
                    openAuthModal("login");
                  }
                }}
                className="flex-1 h-full flex items-center justify-center select-none touch-manipulation active:scale-95 transition-transform"
                aria-label="Tài Khoản"
              >
                {active ? (
                  <div className="w-[88%] h-[44px] rounded-full bg-[#1B2A22] border border-brand-green/35 flex flex-col items-center justify-center gap-0.5 relative transition-colors duration-150">
                    {user?.avatar ? (
                      <div className="w-[19px] h-[19px] rounded-full overflow-hidden shrink-0 border border-brand-green relative">
                        <Image src={user.avatar} alt="" fill unoptimized className="object-cover" sizes="19px" />
                      </div>
                    ) : (
                      <User className="w-5 h-5 text-brand-green" strokeWidth={1.85} />
                    )}
                    <span className="text-[10px] font-bold text-brand-green tracking-tight leading-none">
                      Tài khoản
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 py-1 text-white/70 hover:text-white transition-colors">
                    {user?.avatar ? (
                      <div className="w-[20px] h-[20px] rounded-full overflow-hidden shrink-0 border border-white/20 relative">
                        <Image src={user.avatar} alt="" fill unoptimized className="object-cover" sizes="20px" />
                      </div>
                    ) : (
                      <User className="w-[19px] h-[19px] text-white/70 hover:text-white opacity-80" strokeWidth={1.85} />
                    )}
                    <span className="text-[9.5px] font-semibold tracking-tight leading-none">
                      Tài khoản
                    </span>
                  </div>
                )}
              </button>
            );
          })()}

          {/* Tab 5: Tải App (Temporarily hidden) */}
          {false && (() => {
            const active = currentActiveTab === "/tai-app";
            return (
              <Link
                href="/tai-app"
                prefetch={true}
                onClick={(e) => handleBottomNavNavigate("/tai-app", e)}
                className="flex-1 h-full flex items-center justify-center select-none touch-manipulation active:scale-95 transition-transform"
                aria-label="Tải App"
              >
                {active ? (
                  <div className="w-[88%] h-[44px] rounded-full bg-brand-green/20 border border-brand-green/50 shadow-[0_0_14px_rgba(32,214,107,0.35)] flex flex-col items-center justify-center gap-0.5 relative transition-all duration-150">
                    <SidebarAnimatedIcon type="smartphone" size={20} className="text-brand-green" isActive={true} />
                    <span className="text-[10px] font-extrabold text-brand-green tracking-tight leading-none">
                      Tải app
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-1 py-1 text-white/70 hover:text-white transition-colors">
                    <SidebarAnimatedIcon type="smartphone" size={19} className="opacity-80" />
                    <span className="text-[9.5px] font-semibold tracking-tight leading-none">
                      Tải app
                    </span>
                  </div>
                )}
              </Link>
            );
          })()}
        </div>
      </nav>

      {/* Floating 3-Gạch Menu Toggle Button (Chỉ xuất hiện trên trang chi tiết phim mobile) */}
      {isMovieDetailPage && !isPlayerFullscreen && (
        <button
          type="button"
          onClick={() => setIsDetailNavCollapsed((prev) => !prev)}
          className={cn(
            "lg:hidden fixed z-[141] transition-all duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)]",
            "flex items-center gap-1.5 active:scale-95 cursor-pointer touch-manipulation select-none",
            isDetailNavCollapsed
              ? "bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-3.5 px-3 py-2 rounded-2xl bg-[#121518] border border-white/15 text-white shadow-[0_8px_24px_rgba(0,0,0,0.85)] hover:border-brand-green/40 hover:text-brand-green"
              : "bottom-[calc(72px+env(safe-area-inset-bottom,0px))] right-3.5 px-2.5 py-1.5 rounded-xl bg-[#121518] border border-white/15 text-white/85 shadow-[0_4px_16px_rgba(0,0,0,0.8)] hover:text-white"
          )}
          aria-label={isDetailNavCollapsed ? "Mở thanh điều hướng" : "Thu gọn thanh điều hướng"}
          title={isDetailNavCollapsed ? "Mở menu điều hướng" : "Thu gọn menu điều hướng"}
        >
          {isDetailNavCollapsed ? (
            <>
              <Menu className="w-4 h-4 text-emerald-400 stroke-[2.4]" />
              <span className="text-[11px] font-bold tracking-tight text-white">Menu</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[10.5px] font-semibold text-white/80">Thu gọn</span>
            </>
          )}
        </button>
      )}

      {/* Mobile Account Backdrop */}
      {isAccountOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsAccountOpen(false)}
        />
      )}

      {/* Mobile Account Floating Sheet */}
      {isAccountOpen && (
        <div
          className="lg:hidden fixed left-1/2 -translate-x-1/2 z-[130] w-[calc(100%-24px)] max-w-[390px] max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain bg-[#121518] border border-white/15 rounded-3xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] animate-in fade-in slide-in-from-bottom-5 duration-200 pointer-events-auto select-none"
          style={{ bottom: "max(4.75rem, calc(env(safe-area-inset-bottom, 0px) + 4.5rem))" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Pill Handle */}
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-2.5 shrink-0" />

          {user ? (
            <div>
              {/* User Profile Info Card */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={cn(
                    "w-9 h-9 sm:w-10 sm:h-10 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center shrink-0 relative",
                    isSuperAdmin
                      ? "bg-gradient-to-tr from-amber-400 via-emerald-400 to-brand-green text-black ring-2 ring-amber-400/60"
                      : "bg-gradient-to-tr from-brand-green to-emerald-300 text-black"
                  )}>
                    {(user.name || user.email || "U").charAt(0).toUpperCase()}
                    {isSuperAdmin && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center text-[9px] text-black ring-1.5 ring-[#0d1310]">
                        <Crown className="w-2 h-2 fill-current" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs sm:text-sm text-white truncate">{user.name}</span>
                      {isSuperAdmin && (
                        <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-white/50 truncate font-mono mt-0.5">{user.email}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAccountOpen(false)}
                  className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              {/* Super Admin Control Center Hub */}
              {isSuperAdmin && (
                <div className="mb-2.5 p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-emerald-950/70 via-[#0c140f] to-black border border-emerald-500/35 shadow-[0_4px_25px_rgba(0,0,0,0.6)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-emerald-400/90 uppercase tracking-wider flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      Bảng Điều Hành Quản Trị
                    </span>
                  </div>

                  {/* Master Button to Admin */}
                  <Link
                    href="/admin"
                    onClick={() => setIsAccountOpen(false)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500/25 via-brand-green/30 to-emerald-500/25 hover:from-emerald-500/35 hover:to-brand-green/40 border border-emerald-400/40 transition-all group cursor-pointer active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform shrink-0">
                        <Shield className="w-3 h-3" />
                      </div>
                      <div className="min-w-0 text-left">
                        <p className="font-black text-xs text-white group-hover:text-emerald-300 transition-colors truncate">
                          Mở Trang Quản Trị Hệ Thống
                        </p>
                        <p className="text-[9.5px] text-white/60 font-normal truncate">Quản trị toàn quyền website</p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:translate-x-1 transition-transform shrink-0 ml-1" />
                  </Link>

                  {/* 4 Quick Navigation Shortcuts */}
                  <div className="grid grid-cols-4 gap-1 pt-0.5">
                    <Link
                      href="/admin?tab=users"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl bg-white/[0.04] hover:bg-emerald-500/10 border border-white/5 hover:border-emerald-500/30 text-white/80 hover:text-white transition-all text-center group cursor-pointer"
                    >
                      <Users className="w-3 h-3 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[9.5px] font-semibold">Thành Viên</span>
                    </Link>

                    <Link
                      href="/admin?tab=featured"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl bg-white/[0.04] hover:bg-amber-500/10 border border-white/5 hover:border-amber-500/30 text-white/80 hover:text-white transition-all text-center group cursor-pointer"
                    >
                      <Film className="w-3 h-3 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[9.5px] font-semibold">Ghim Phim</span>
                    </Link>

                    <Link
                      href="/admin?tab=reports"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl bg-white/[0.04] hover:bg-rose-500/10 border border-white/5 hover:border-rose-500/30 text-white/80 hover:text-white transition-all text-center group cursor-pointer"
                    >
                      <AlertTriangle className="w-3 h-3 text-rose-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[9.5px] font-semibold">Báo Lỗi</span>
                    </Link>

                    <Link
                      href="/admin?tab=settings"
                      onClick={() => setIsAccountOpen(false)}
                      className="flex flex-col items-center gap-1 py-1.5 px-1 rounded-xl bg-white/[0.04] hover:bg-sky-500/10 border border-white/5 hover:border-sky-500/30 text-white/80 hover:text-white transition-all text-center group cursor-pointer"
                    >
                      <Settings className="w-3 h-3 text-sky-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[9.5px] font-semibold">Cấu Hình</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* Action Links */}
              <div className="space-y-0.5">
                <Link
                  href="/favorites"
                  onClick={() => setIsAccountOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-white/90 hover:text-white hover:bg-white/[0.08] transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/70 group-hover:text-red-400 group-hover:bg-red-500/10 transition-colors">
                      <Heart className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold">Phim Yêu Thích</span>
                  </div>
                  <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-white/5 text-white/60 font-mono">
                    Đồng bộ
                  </span>
                </Link>

                <Link
                  href="/recently"
                  onClick={() => setIsAccountOpen(false)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-white/90 hover:text-white hover:bg-white/[0.08] transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/70 group-hover:text-brand-green group-hover:bg-brand-green/10 transition-colors">
                      <History className="w-3.5 h-3.5" />
                    </div>
                    <span className="font-semibold">Lịch Sử Xem</span>
                  </div>
                  <span className="text-[9.5px] px-2 py-0.5 rounded-full bg-white/5 text-white/60 font-mono">
                    Đồng bộ
                  </span>
                </Link>

                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-white/90 hover:text-white hover:bg-white/[0.08] transition-colors group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/70 group-hover:text-brand-green group-hover:bg-brand-green/10 transition-colors">
                      <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin text-brand-green")} />
                    </div>
                    <span className="font-semibold">Đồng Bộ Ngay</span>
                  </div>
                  <span className="text-[9.5px] text-brand-green font-mono">
                    {isSyncing ? "Đang lưu..." : "Sẵn sàng"}
                  </span>
                </button>
              </div>

              <div className="border-t border-white/10 my-1.5" />

              {/* Logout Button */}
              <button
                type="button"
                onClick={async () => {
                  setIsAccountOpen(false);
                  await logout();
                  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
                    window.location.href = "/";
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Đăng Xuất</span>
              </button>
            </div>
          ) : (
            <div>
              {/* Not Logged In View */}
              <div className="flex items-center justify-between pb-2.5 border-b border-white/10 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-2xl bg-brand-green/15 border border-brand-green/30 flex items-center justify-center text-brand-green">
                    <User className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-bold text-white">Tài Khoản Hi Phim</h3>
                    <p className="text-[10px] sm:text-[11px] text-white/50">Trải nghiệm xem phim riêng tư</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAccountOpen(false)}
                  className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Đóng"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>

              <p className="text-xs text-white/70 mb-3 leading-relaxed">
                Đăng nhập để lưu lịch sử xem phim và đồng bộ danh sách phim yêu thích xuyên suốt mọi thiết bị.
              </p>

              <div className="grid grid-cols-2 gap-2 mb-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountOpen(false);
                    openAuthModal("login");
                  }}
                  className="h-9 sm:h-10 rounded-xl bg-brand-green hover:bg-brand-green-hover text-black font-extrabold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Đăng Nhập
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountOpen(false);
                    openAuthModal("register");
                  }}
                  className="h-9 sm:h-10 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 active:scale-95 transition-all cursor-pointer"
                >
                  Đăng Ký
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Backdrop Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[120] bg-black/75"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsMobileOpen(false);
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        />
      )}

      {/* Desktop & Mobile Sidebar Container */}
      <aside
        className={cn(
          "fixed text-cinema-text flex flex-col select-none will-change-transform transition-all duration-300 ease-out",
          // Mobile state: full height slide drawer
          "top-0 left-0 bottom-0 w-[280px] bg-cinema-sub border-r border-white/10 rounded-none shadow-none",
          isMobileOpen ? "translate-x-0 z-[130]" : "-translate-x-full lg:translate-x-0 z-[100]",
          // Desktop state: floating island card matching bento / cut-out style (rounded corners, detached borders)
          "lg:top-3 lg:left-3 lg:w-[230px] lg:h-fit lg:max-h-[calc(100vh-24px)] lg:rounded-2xl lg:border lg:border-white/10 lg:bg-[#0B100E]/95 lg:backdrop-blur-xl lg:shadow-[0_12px_40px_rgba(0,0,0,0.65)] lg:overflow-hidden"
        )}
      >
        {/* Sidebar Header / Brand Name (Desktop & Mobile) */}
        <div className="lg:hidden h-14 px-4 flex items-center justify-between border-b border-white/[0.08] shrink-0">
          <Link href="/" className="flex items-center select-none py-1 group" aria-label="Về trang chủ Hi Phim">
            <BrandLogo size="md" />
          </Link>

          {/* Close Button — Mobile */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsMobileOpen(false);
            }}
            aria-label="Đóng Menu"
            className="p-2 rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Navigation Body - Balanced spacing to fit frame seamlessly and prevent cutoff */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 lg:px-2.5 lg:pt-3.5 lg:pb-3 space-y-2.5 lg:space-y-0.5 custom-scrollbar">
          
          {/* Main Nav Section */}
          <div className="space-y-1 lg:space-y-1">
            <span className="px-3 lg:px-2 text-[11px] lg:text-[10px] font-extrabold text-white/45 uppercase tracking-wider block mb-1.5 lg:mb-1">
              MENU CHÍNH
            </span>

            {NAV_MAIN.map((item) => (
              <SidebarMainNavItem
                key={item.href}
                item={item}
                active={isLinkActive(item.href, item.typeList)}
                onClick={() => {
                  setIsMobileOpen(false);
                  navigateToTab(item.href);
                }}
                onPrefetch={() => {
                  if (item.typeList) instantMovieStore.prefetch(item.typeList);
                }}
              />
            ))}
          </div>

          {/* Divider 1 */}
          <div className="h-[1px] bg-white/5 mx-2 lg:mx-1 my-1.5 lg:my-1.5" />

          {/* Discovery / Selection Boards Trigger */}
          <div className="space-y-1 lg:space-y-1">
            <span className="px-3 lg:px-2 text-[11px] lg:text-[10px] font-extrabold text-white/45 uppercase tracking-wider block mb-1.5 lg:mb-1">
              KHÁM PHÁ
            </span>

            {/* Thể Loại (Categories Modal Trigger) */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveModal("categories");
              }}
              onMouseEnter={() => setIsCategoryHovered(true)}
              onMouseLeave={() => setIsCategoryHovered(false)}
              className={cn(
                "w-full relative flex items-center justify-between px-3 lg:px-2.5 py-2 lg:py-2 rounded-xl text-sm lg:text-[13px] font-medium lg:font-semibold transition-all duration-150 group text-left cursor-pointer border",
                currentCategory
                  ? "bg-brand-green/15 text-brand-green border-brand-green/30 shadow-[0_0_12px_rgba(32,214,107,0.15)] font-semibold"
                  : "text-white/65 hover:text-white hover:bg-white/[0.06] border-transparent"
              )}
            >
              <div className="flex items-center gap-3 lg:gap-2 min-w-0">
                <SidebarAnimatedIcon
                  type="layers"
                  isHovered={isCategoryHovered}
                  isActive={!!currentCategory}
                  className={cn(
                    "w-[18px] h-[18px] lg:w-4 lg:h-4 shrink-0 transition-colors duration-150",
                    currentCategory ? "text-brand-green" : "text-white/60 group-hover:text-white"
                  )}
                />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">Thể Loại</span>
                  {activeCategoryObj && (
                    <span className="text-xs lg:text-[10px] text-brand-green font-normal truncate">
                      {activeCategoryObj.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 lg:gap-1 shrink-0 ml-1">
                <span className="text-[10px] lg:text-[9px] px-2 lg:px-1.5 py-0.5 rounded-full bg-white/5 text-white/50 group-hover:bg-brand-green/20 group-hover:text-brand-green font-mono font-bold">
                  {categories.length || "24"}
                </span>
                <ChevronRight className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Quốc Gia (Countries Modal Trigger) */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveModal("countries");
              }}
              onMouseEnter={() => setIsCountryHovered(true)}
              onMouseLeave={() => setIsCountryHovered(false)}
              className={cn(
                "w-full relative flex items-center justify-between px-3 lg:px-2.5 py-2 lg:py-2 rounded-xl text-sm lg:text-[13px] font-medium lg:font-semibold transition-all duration-150 group text-left cursor-pointer border",
                currentCountry
                  ? "bg-brand-green/15 text-brand-green border-brand-green/30 shadow-[0_0_12px_rgba(32,214,107,0.15)] font-semibold"
                  : "text-white/65 hover:text-white hover:bg-white/[0.06] border-transparent"
              )}
            >
              <div className="flex items-center gap-3 lg:gap-2 min-w-0">
                <SidebarAnimatedIcon
                  type="globe"
                  isHovered={isCountryHovered}
                  isActive={!!currentCountry}
                  className={cn(
                    "w-[18px] h-[18px] lg:w-4 lg:h-4 shrink-0 transition-colors duration-150",
                    currentCountry ? "text-brand-green" : "text-white/60 group-hover:text-white"
                  )}
                />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">Quốc Gia</span>
                  {activeCountryObj && (
                    <span className="text-xs lg:text-[10px] text-brand-green font-normal truncate">
                      {activeCountryObj.name}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 lg:gap-1 shrink-0 ml-1">
                <span className="text-[10px] lg:text-[9px] px-2 lg:px-1.5 py-0.5 rounded-full bg-white/5 text-white/50 group-hover:bg-brand-green/20 group-hover:text-brand-green font-mono font-bold">
                  {countries.length || "12+"}
                </span>
                <ChevronRight className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>

            {/* Năm Phát Hành (Years Modal Trigger) */}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setActiveModal("years");
              }}
              onMouseEnter={() => setIsYearHovered(true)}
              onMouseLeave={() => setIsYearHovered(false)}
              className={cn(
                "w-full relative flex items-center justify-between px-3 lg:px-2.5 py-2 lg:py-2 rounded-xl text-sm lg:text-[13px] font-medium lg:font-semibold transition-all duration-150 group text-left cursor-pointer border",
                currentYear
                  ? "bg-brand-green/15 text-brand-green border-brand-green/30 shadow-[0_0_12px_rgba(32,214,107,0.15)] font-semibold"
                  : "text-white/65 hover:text-white hover:bg-white/[0.06] border-transparent"
              )}
            >
              <div className="flex items-center gap-3 lg:gap-2 min-w-0">
                <SidebarAnimatedIcon
                  type="calendar"
                  isHovered={isYearHovered}
                  isActive={!!currentYear}
                  className={cn(
                    "w-[18px] h-[18px] lg:w-4 lg:h-4 shrink-0 transition-colors duration-150",
                    currentYear ? "text-brand-green" : "text-white/60 group-hover:text-white"
                  )}
                />
                <div className="flex flex-col min-w-0">
                  <span className="whitespace-nowrap">Năm Phát Hành</span>
                  {currentYear && (
                    <span className="text-xs lg:text-[10px] text-brand-green font-normal truncate">
                      Năm {currentYear}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 lg:gap-1 shrink-0 ml-1">
                <span className="text-[10px] lg:text-[9px] px-2 lg:px-1.5 py-0.5 rounded-full bg-white/5 text-white/50 group-hover:bg-brand-green/20 group-hover:text-brand-green font-mono font-bold">
                  {YEARS_LIST.length}+
                </span>
                <ChevronRight className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-white/40 group-hover:text-white group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* BOTTOM PERSONAL DOCK: 2 Ô NGANG (LỊCH SỬ & YÊU THÍCH)     */}
        {/* ======================================================== */}
        <div className="shrink-0 p-2 lg:p-2 border-t border-white/[0.08] bg-[#080D0B]/90 backdrop-blur-md">
          <div className="grid grid-cols-2 gap-1.5 lg:gap-1.5">
            {/* Ô 1: Lịch Sử */}
            <button
              type="button"
              onClick={() => {
                setIsMobileOpen(false);
                navigateToTab("/recently");
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 h-9 lg:h-8.5 px-2 rounded-xl text-xs lg:text-[11.5px] font-bold transition-all border select-none cursor-pointer active:scale-95",
                currentActiveTab === "/recently"
                  ? "bg-brand-green/15 text-brand-green border-brand-green/40 shadow-[0_0_12px_rgba(32,214,107,0.2)]"
                  : "bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border-white/10 hover:border-brand-green/40"
              )}
              aria-label="Lịch sử xem phim"
              title="Lịch sử xem phim"
            >
              <Clock className={cn("w-3.5 h-3.5 shrink-0", currentActiveTab === "/recently" ? "text-brand-green" : "text-white/60")} />
              <span className="truncate">Lịch sử</span>
            </button>

            {/* Ô 2: Yêu Thích */}
            <button
              type="button"
              onClick={() => {
                setIsMobileOpen(false);
                navigateToTab("/favorites");
              }}
              className={cn(
                "flex items-center justify-center gap-1.5 h-9 lg:h-8.5 px-2 rounded-xl text-xs lg:text-[11.5px] font-bold transition-all border select-none cursor-pointer active:scale-95",
                currentActiveTab === "/favorites"
                  ? "bg-brand-green/15 text-brand-green border-brand-green/40 shadow-[0_0_12px_rgba(32,214,107,0.2)]"
                  : "bg-white/[0.04] hover:bg-white/[0.08] text-white/70 hover:text-white border-white/10 hover:border-brand-green/40"
              )}
              aria-label="Phim yêu thích"
              title="Phim yêu thích"
            >
              <Heart className={cn("w-3.5 h-3.5 shrink-0", currentActiveTab === "/favorites" ? "fill-brand-green text-brand-green" : "text-white/60")} />
              <span className="truncate">Yêu thích</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* KHÁM PHÁ BOTTOM SHEET MENU (ONFLIX STYLE) - MOBILE ONLY */}
      {/* ======================================================== */}
      <MobileExploreSheet
        isOpen={isExploreOpen}
        onClose={() => setIsExploreOpen(false)}
        onOpenCategories={() => {
          setIsExploreOpen(false);
          setActiveModal("categories");
        }}
        onOpenCountries={() => {
          setIsExploreOpen(false);
          setActiveModal("countries");
        }}
        onOpenYears={() => {
          setIsExploreOpen(false);
          setActiveModal("years");
        }}
        categoriesCount={categories.length}
        countriesCount={countries.length}
      />

      {/* ======================================================== */}
      {/* FULLSCREEN MODAL DANH MỤC RIÊNG BIỆT (THỂ LOẠI / QUỐC GIA / NĂM)    */}
      {/* ======================================================== */}
      {activeModal && (
        <div
          ref={modalScrollRef}
          onScroll={(e) => {
            const target = e.currentTarget;
            setModalScrolled(target.scrollTop > 180);
          }}
          className={cn(
            "fixed inset-0 z-[150] overflow-y-auto bg-[#050807] overscroll-contain shadow-none modal-scroll custom-scrollbar select-none transition-opacity duration-200",
            isClosing ? "opacity-0 pointer-events-none" : "opacity-100 animate-in fade-in duration-200"
          )}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="min-h-full flex flex-col">
            {/* Sticky Header Container matching SearchOverlay & NotificationBell */}
            <div className="sticky top-0 z-40 bg-[#050807]/95 backdrop-blur-md border-b border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.8)]">
              <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6 pb-3 sm:pb-4 space-y-3 sm:space-y-4">
                
                {/* Top Row: Icon + Title + Count Badge + Close Action */}
                <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-brand-green/15 border border-brand-green/30 flex items-center justify-center text-brand-green shrink-0 shadow-[0_0_15px_rgba(32,214,107,0.2)]">
                      {activeModal === "categories" && <Layers className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.4]" />}
                      {activeModal === "countries" && <Globe className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.4]" />}
                      {activeModal === "years" && <Calendar className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.4]" />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight truncate">
                          {activeModal === "categories" && "Thể Loại Phim"}
                          {activeModal === "countries" && "Quốc Gia Điện Ảnh"}
                          {activeModal === "years" && "Năm Phát Hành"}
                        </h2>
                        <span className="text-[11px] sm:text-xs font-mono font-extrabold text-brand-green bg-brand-green/12 border border-brand-green/30 px-2.5 py-0.5 rounded-full shrink-0">
                          {activeModal === "categories" && `${categories.length} THỂ LOẠI`}
                          {activeModal === "countries" && `${countries.length} QUỐC GIA`}
                          {activeModal === "years" && `NĂM ${currentYearNum}`}
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-white/50 mt-0.5 truncate">
                        {activeModal === "categories" && "Khám phá kho phim phong phú theo thể loại bạn yêu thích"}
                        {activeModal === "countries" && "Lọc phim theo xuất xứ và nền điện ảnh quốc gia"}
                        {activeModal === "years" && "Tìm kiếm các tác phẩm theo năm phát hành và thập niên"}
                      </p>
                    </div>
                  </div>

                  {/* Close Button + ESC Badge */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <kbd className="hidden sm:inline-flex items-center px-2 py-1 rounded text-[10px] font-mono text-white/40 bg-white/5 border border-white/10">
                      ESC Đóng
                    </kbd>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="p-2 sm:p-2.5 rounded-full bg-white/5 hover:bg-white/15 text-white/70 hover:text-white border border-white/10 transition-all shrink-0 active:scale-95 cursor-pointer"
                      aria-label="Đóng bảng"
                    >
                      <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </div>
                </div>

                {/* Search & Sub-filters inside Sticky Header */}
                {activeModal === "categories" && (
                  <div className="space-y-2.5">
                    <div className="relative flex items-center">
                      <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-4 text-brand-green stroke-[2.4] pointer-events-none" />
                      <input
                        type="text"
                        aria-label="Lọc thể loại phim"
                        value={categorySearchQuery}
                        onChange={(e) => setCategorySearchQuery(e.target.value)}
                        placeholder="Lọc nhanh thể loại (Hành động, Cổ trang, Tình cảm...)"
                        className="w-full h-11 sm:h-12 bg-white/[0.05] hover:bg-white/[0.07] focus:bg-white/[0.09] border border-white/10 focus:border-brand-green/60 text-white placeholder-white/40 text-sm sm:text-base rounded-2xl pl-12 pr-10 outline-none transition-all duration-200"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      {categorySearchQuery && (
                        <button
                          type="button"
                          onClick={() => setCategorySearchQuery("")}
                          aria-label="Xóa tìm kiếm"
                          className="absolute right-3 p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {!categorySearchQuery.trim() && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {[
                          { id: "all", label: "Tất Cả" },
                          { id: "popular", label: "Phổ Biến" },
                          { id: "action", label: "Hành Động & Kịch Tính" },
                          { id: "romance", label: "Tình Cảm & Cổ Trang" },
                          { id: "anime", label: "Hoạt Hình & Khác" },
                        ].map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setCategoryThematicFilter(f.id as any)}
                            className={cn(
                              "px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all select-none active:scale-95 cursor-pointer",
                              categoryThematicFilter === f.id
                                ? "bg-brand-green/15 text-brand-green border border-brand-green/45 font-extrabold shadow-[0_0_12px_rgba(32,214,107,0.15)]"
                                : "bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/[0.08]"
                            )}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeModal === "countries" && (
                  <div className="space-y-2.5">
                    <div className="relative flex items-center">
                      <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-4 text-brand-green stroke-[2.4] pointer-events-none" />
                      <input
                        type="text"
                        aria-label="Lọc quốc gia phim"
                        value={countrySearchQuery}
                        onChange={(e) => setCountrySearchQuery(e.target.value)}
                        placeholder="Lọc nhanh quốc gia (Hàn Quốc, Âu Mỹ, Trung Quốc...)"
                        className="w-full h-11 sm:h-12 bg-white/[0.05] hover:bg-white/[0.07] focus:bg-white/[0.09] border border-white/10 focus:border-brand-green/60 text-white placeholder-white/40 text-sm sm:text-base rounded-2xl pl-12 pr-10 outline-none transition-all duration-200"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      {countrySearchQuery && (
                        <button
                          type="button"
                          onClick={() => setCountrySearchQuery("")}
                          aria-label="Xóa tìm kiếm"
                          className="absolute right-3 p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {!countrySearchQuery.trim() && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {[
                          { id: "all", label: "Tất Cả" },
                          { id: "popular", label: "Nổi Bật" },
                          { id: "asia", label: "Châu Á" },
                          { id: "west", label: "Âu Mỹ & Toàn Cầu" },
                        ].map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setCountryRegionFilter(f.id as any)}
                            className={cn(
                              "px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all select-none active:scale-95 cursor-pointer",
                              countryRegionFilter === f.id
                                ? "bg-brand-green/15 text-brand-green border border-brand-green/45 font-extrabold shadow-[0_0_12px_rgba(32,214,107,0.15)]"
                                : "bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/[0.08]"
                            )}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeModal === "years" && (
                  <div className="space-y-2.5">
                    <div className="relative flex items-center">
                      <Search className="w-4 h-4 sm:w-5 sm:h-5 absolute left-4 text-brand-green stroke-[2.4] pointer-events-none" />
                      <input
                        type="text"
                        aria-label="Nhập năm phát hành"
                        value={yearSearchQuery}
                        onChange={(e) => setYearSearchQuery(e.target.value)}
                        placeholder="Lọc nhanh năm phát hành (2026, 2025, 2024...)"
                        className="w-full h-11 sm:h-12 bg-white/[0.05] hover:bg-white/[0.07] focus:bg-white/[0.09] border border-white/10 focus:border-brand-green/60 text-white placeholder-white/40 text-sm sm:text-base rounded-2xl pl-12 pr-10 outline-none transition-all duration-200"
                        autoComplete="off"
                        spellCheck={false}
                      />
                      {yearSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setYearSearchQuery("")}
                          aria-label="Xóa tìm kiếm"
                          className="absolute right-3 p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {!yearSearchQuery.trim() && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {[
                          { id: "all", label: "Tất Cả Năm" },
                          { id: "2020s", label: "2020s Mới" },
                          { id: "2010s", label: "2010s" },
                          { id: "2000s", label: "2000s" },
                          { id: "classic", label: "Kinh Điển" },
                        ].map((f) => (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setYearDecade(f.id as any)}
                            className={cn(
                              "px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-bold whitespace-nowrap transition-all select-none active:scale-95 cursor-pointer",
                              yearDecade === f.id
                                ? "bg-brand-green/15 text-brand-green border border-brand-green/45 font-extrabold shadow-[0_0_12px_rgba(32,214,107,0.15)]"
                                : "bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/[0.08]"
                            )}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>

            {/* Main Content Body */}
            <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
              {/* CATEGORIES GRID - Upgraded large cards with icon badges & rich typography */}
              {activeModal === "categories" && (
                <div ref={categoriesScrollRef}>
                  {displayedCategories.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4.5 pb-10">
                      {displayedCategories.map((cat, idx) => {
                        const active = currentCategory === cat.slug;
                        const emoji = getCategoryEmoji(cat.slug) || "🎬";
                        return (
                          <button
                            key={`${cat.slug}-${idx}`}
                            type="button"
                            onClick={(e) => handleSelectCategory(cat.slug, e)}
                            className={cn(
                              "group relative flex items-center justify-between min-h-[66px] sm:min-h-[74px] p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 active:scale-95 min-w-0 cursor-pointer shadow-sm hover:-translate-y-0.5",
                              active
                                ? "bg-brand-green/[0.14] text-brand-green border-brand-green/60 font-black shadow-[0_0_24px_rgba(32,214,107,0.22)] ring-1 ring-brand-green/30"
                                : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] hover:border-brand-green/40 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4),0_0_12px_rgba(32,214,107,0.12)] text-white"
                            )}
                          >
                            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                              {/* Large Emoji / Icon Badge */}
                              <div
                                className={cn(
                                  "w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-lg sm:text-xl shrink-0 transition-all duration-200 shadow-sm",
                                  active
                                    ? "bg-brand-green/20 border border-brand-green/40 text-brand-green scale-105"
                                    : "bg-white/[0.06] group-hover:bg-brand-green/15 border border-white/10 group-hover:border-brand-green/35 group-hover:scale-105"
                                )}
                              >
                                {emoji}
                              </div>

                              <div className="min-w-0 flex-1">
                                <span
                                  className={cn(
                                    "text-sm sm:text-base font-extrabold tracking-tight truncate block group-hover:text-brand-green transition-colors",
                                    active ? "text-brand-green font-black" : "text-white"
                                  )}
                                >
                                  {cat.name}
                                </span>
                                <span className="text-[11px] font-semibold text-white/40 block truncate mt-0.5">
                                  Thể loại phim
                                </span>
                              </div>
                            </div>

                            {active && (
                              <div className="w-6 h-6 rounded-full bg-brand-green/20 border border-brand-green/50 flex items-center justify-center shrink-0 ml-2 shadow-[0_0_10px_rgba(32,214,107,0.3)]">
                                <Check className="w-3.5 h-3.5 text-brand-green stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-white/40 text-sm sm:text-base">
                      Không tìm thấy thể loại nào phù hợp với &quot;{categorySearchQuery}&quot;
                    </div>
                  )}
                </div>
              )}

              {/* COUNTRIES GRID - Upgraded large cards with HD flag badges & rich typography */}
              {activeModal === "countries" && (
                <div ref={countriesScrollRef}>
                  {displayedCountries.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5 sm:gap-4.5 pb-10">
                      {displayedCountries.map((c) => {
                        const active = currentCountry === c.slug;
                        const code = c.code || getCountryCode(c.slug) || getCountryCode(c.name);
                        return (
                          <button
                            key={c.slug}
                            type="button"
                            onClick={(e) => handleSelectCountry(c.slug, e)}
                            className={cn(
                              "group relative flex items-center justify-between min-h-[66px] sm:min-h-[74px] p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 active:scale-95 min-w-0 cursor-pointer shadow-sm hover:-translate-y-0.5",
                              active
                                ? "bg-brand-green/[0.14] text-brand-green border-brand-green/60 font-black shadow-[0_0_24px_rgba(32,214,107,0.22)] ring-1 ring-brand-green/30"
                                : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] hover:border-brand-green/40 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4),0_0_12px_rgba(32,214,107,0.12)] text-white"
                            )}
                          >
                            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                              {/* Large HD Flag Badge */}
                              <div
                                className={cn(
                                  "w-11 h-7 sm:w-12 sm:h-8 rounded-lg overflow-hidden border border-white/20 shadow-md shrink-0 bg-black/40 flex items-center justify-center transition-all duration-200",
                                  active
                                    ? "border-brand-green/50 scale-105 shadow-[0_0_12px_rgba(32,214,107,0.3)]"
                                    : "group-hover:scale-105 group-hover:border-brand-green/40"
                                )}
                              >
                                {(!code || code === "WW") ? (
                                  <Globe className="w-5 h-5 text-brand-green" />
                                ) : (
                                  <img
                                    src={`https://flagcdn.com/w160/${code.toLowerCase()}.png`}
                                    alt={c.name}
                                    loading="lazy"
                                    className="w-full h-full object-cover transition-transform duration-200"
                                    onError={(e) => {
                                      e.currentTarget.style.display = "none";
                                    }}
                                  />
                                )}
                              </div>

                              <div className="min-w-0 flex-1">
                                <span
                                  className={cn(
                                    "text-sm sm:text-base font-extrabold tracking-tight truncate block group-hover:text-brand-green transition-colors",
                                    active ? "text-brand-green font-black" : "text-white"
                                  )}
                                >
                                  {c.name}
                                </span>
                                <span className="text-[11px] font-semibold text-white/40 block truncate mt-0.5">
                                  Điện ảnh {c.name}
                                </span>
                              </div>
                            </div>

                            {active && (
                              <div className="w-6 h-6 rounded-full bg-brand-green/20 border border-brand-green/50 flex items-center justify-center shrink-0 ml-2 shadow-[0_0_10px_rgba(32,214,107,0.3)]">
                                <Check className="w-3.5 h-3.5 text-brand-green stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-white/40 text-sm sm:text-base">
                      Không tìm thấy quốc gia nào phù hợp với &quot;{countrySearchQuery}&quot;
                    </div>
                  )}
                </div>
              )}

              {/* YEARS GRID - Upgraded large cards with decade tags & bold numbers */}
              {activeModal === "years" && (
                <div ref={yearsScrollRef}>
                  {displayedYears.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 pb-10">
                      {displayedYears.map((y) => {
                        const active = currentYear === String(y);
                        const isLatest = y >= currentYearNum - 1;
                        return (
                          <button
                            key={y}
                            type="button"
                            onClick={(e) => handleSelectYear(y, e)}
                            className={cn(
                              "group relative h-16 sm:h-18 px-3 sm:px-4 rounded-2xl border text-center transition-all duration-200 active:scale-95 min-w-0 flex flex-col items-center justify-center cursor-pointer shadow-sm hover:-translate-y-0.5",
                              active
                                ? "bg-brand-green/[0.14] text-brand-green border-brand-green/60 font-black shadow-[0_0_24px_rgba(32,214,107,0.22)] ring-1 ring-brand-green/30"
                                : "bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] hover:border-brand-green/40 hover:shadow-[0_8px_20px_rgba(0,0,0,0.4),0_0_12px_rgba(32,214,107,0.12)] text-white"
                            )}
                          >
                            {isLatest && !active && (
                              <span className="absolute top-1.5 right-2 px-1.5 py-0.5 rounded-full text-[9px] font-black text-brand-green bg-brand-green/15 border border-brand-green/35 uppercase tracking-tighter">
                                MỚI
                              </span>
                            )}
                            <span
                              className={cn(
                                "text-base sm:text-xl font-mono tracking-tight transition-colors",
                                active ? "font-black text-brand-green scale-105" : "font-extrabold text-white group-hover:text-brand-green"
                              )}
                            >
                              {y}
                            </span>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white/40 mt-0.5">
                              {y >= 2020 ? "Thập niên 20" : y >= 2010 ? "Thập niên 10" : y >= 2000 ? "Thập niên 00" : "Kinh điển"}
                            </span>

                            {active && (
                              <div className="absolute top-1.5 left-2 w-4 h-4 rounded-full bg-brand-green/20 flex items-center justify-center shadow-[0_0_6px_rgba(32,214,107,0.4)]">
                                <Check className="w-2.5 h-2.5 text-brand-green stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-20 text-center text-white/40 text-sm sm:text-base">
                      Không tìm thấy năm nào phù hợp với &quot;{yearSearchQuery}&quot;
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Nút scroll tiện ích nổi trong Modal (Floating Scroll FAB) - Chỉ hiện khi đã cuộn qua một đoạn */}
            {modalScrolled && (
              <div className="fixed right-4 sm:right-8 bottom-16 sm:bottom-24 z-50 animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
                <button
                  type="button"
                  onClick={handleModalScrollToggle}
                  className="group flex items-center gap-1.5 sm:gap-2 p-2.5 sm:px-3.5 sm:py-2.5 rounded-full bg-[#050807]/95 hover:bg-black text-brand-green border border-brand-green/50 hover:border-brand-green shadow-[0_4px_25px_rgba(0,0,0,0.85),0_0_15px_rgba(32,214,107,0.3)] backdrop-blur-md transition-all duration-200 active:scale-95 cursor-pointer hover:shadow-[0_0_20px_rgba(32,214,107,0.5)]"
                  title="Cuộn lên đầu trang"
                  aria-label="Cuộn lên đầu trang"
                >
                  <ArrowUp className="w-4 h-4 stroke-[2.8] transition-transform group-hover:-translate-y-0.5" />
                  <span className="hidden sm:inline text-xs font-bold text-white pr-0.5">Lên đầu</span>
                </button>
              </div>
            )}

            {/* Bottom Sticky Action Bar */}
            <div className="sticky bottom-0 z-30 bg-[#050807]/95 backdrop-blur-md border-t border-white/10 py-3 sm:py-4 shadow-[0_-4px_25px_rgba(0,0,0,0.8)] pb-[max(1rem,env(safe-area-inset-bottom))]">
              <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs sm:text-sm text-white/50">
                <div className="flex items-center gap-2 min-w-0">
                  {activeModal === "categories" && currentCategory && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startTransition(() => {
                          router.push("/", { scroll: false });
                        });
                        closeModal();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition-colors font-medium text-xs cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Bỏ chọn ({activeCategoryObj?.name || currentCategory})</span>
                    </button>
                  )}

                  {activeModal === "countries" && currentCountry && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startTransition(() => {
                          router.push("/", { scroll: false });
                        });
                        closeModal();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition-colors font-medium text-xs cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Bỏ chọn ({activeCountryObj?.name || currentCountry})</span>
                    </button>
                  )}

                  {activeModal === "years" && currentYear && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        startTransition(() => {
                          router.push("/", { scroll: false });
                        });
                        closeModal();
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 transition-colors font-medium text-xs cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Bỏ chọn (Năm {currentYear})</span>
                    </button>
                  )}

                  {((activeModal === "categories" && !currentCategory) ||
                    (activeModal === "countries" && !currentCountry) ||
                    (activeModal === "years" && !currentYear)) && (
                    <span className="truncate text-white/40 text-xs sm:text-sm">
                      <span className="hidden sm:inline">Bấm vào mục bất kỳ để lọc phim tức thì • Hỗ trợ phím ESC để đóng</span>
                      <span className="sm:hidden">Chọn mục để lọc tức thì</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto sm:ml-4">
                  <button
                    type="button"
                    onClick={handleModalScrollToggle}
                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-brand-green/15 text-white/80 hover:text-brand-green border border-white/10 hover:border-brand-green/30 transition-all font-medium text-xs cursor-pointer active:scale-95"
                    title={modalScrolled ? "Cuộn lên đầu trang" : "Cuộn xuống danh sách"}
                  >
                    {modalScrolled ? (
                      <>
                        <ArrowUp className="w-3.5 h-3.5 text-brand-green stroke-[2.5]" />
                        <span>Lên đầu</span>
                      </>
                    ) : (
                      <>
                        <ArrowDown className="w-3.5 h-3.5 text-brand-green stroke-[2.5]" />
                        <span>Cuộn xuống</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      closeModal();
                      router.push("/");
                    }}
                    className="text-brand-green hover:underline font-bold shrink-0 text-xs sm:text-sm cursor-pointer whitespace-nowrap"
                  >
                    Xem tất cả phim
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}

const MemoizedSidebarContent = memo(SidebarContent);

export default function Sidebar(props: SidebarProps) {
  return (
    <Suspense fallback={null}>
      <MemoizedSidebarContent {...props} />
    </Suspense>
  );
}
