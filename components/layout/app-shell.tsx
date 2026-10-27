"use client";

import { memo, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import Footer from "@/components/footer";

import { useNavigationTab } from "@/context/navigation-tab-context";
import RecentlyWatchedClient from "@/app/recently/recently-client";
import FavoritesClient from "@/app/favorites/favorites-client";

interface AppShellProps {
  children: React.ReactNode;
}

function AppShellComponent({ children }: AppShellProps) {
  const pathname = usePathname();
  const { activeTab } = useNavigationTab();

  // Standalone pages that do not display the global sidebar/header
  const isStandalonePage =
    pathname.startsWith("/watch") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/maintenance");

  // Real-time client listener for maintenance mode
  useEffect(() => {
    if (isStandalonePage) return;

    const checkMaintenance = async () => {
      try {
        const res = await fetch("/api/system/maintenance");
        if (res.ok) {
          const data = await res.json();
          if (data?.enabled) {
            const hasBypass =
              document.cookie.includes("hiphim_admin_session") ||
              document.cookie.includes("hiphim_maintenance_bypass");
            if (!hasBypass) {
              window.location.replace("/maintenance");
            }
          }
        }
      } catch {
        // ignore network error
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkMaintenance();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    const timer = setInterval(checkMaintenance, 300000); // 5 minutes

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(timer);
    };
  }, [isStandalonePage]);

  if (isStandalonePage) {
    return <>{children}</>;
  }

  // Instant Tab views when user navigates between /, /recently, /favorites
  const showInstantRecently = activeTab === "/recently" && pathname !== "/recently";
  const showInstantFavorites = activeTab === "/favorites" && pathname !== "/favorites";

  // Pages where footer must NOT be displayed:
  // 1. Movie detail pages (/phim/...)
  // 2. Watch history (/recently) - URL route or instant tab view
  // 3. Favorites (/favorites) - URL route or instant tab view
  const isMovieDetailPage = pathname.startsWith("/phim");
  const isRecentlyPage = pathname.startsWith("/recently") || activeTab === "/recently";
  const isFavoritesPage = pathname.startsWith("/favorites") || activeTab === "/favorites";

  const showFooter = !isMovieDetailPage && !isRecentlyPage && !isFavoritesPage;

  return (
    <div className="min-h-screen bg-cinema-bg text-cinema-text">
      {/* Persistent Left Sidebar & Mobile Bottom Dock - Kept in DOM across transitions */}
      <Sidebar />

      {/* Persistent Top Header */}
      <Header />

      {/* Dynamic Right-side Content Container */}
      <div className="min-h-screen lg:pl-[225px] flex flex-col">
        <div className={showInstantRecently || showInstantFavorites ? "hidden" : "contents"}>
          {children}
        </div>
        {showInstantRecently && <RecentlyWatchedClient />}
        {showInstantFavorites && <FavoritesClient />}

        {/* Global Footer Card matching Hi Download (hidden on movie detail pages) */}
        {showFooter && <Footer />}
      </div>
    </div>
  );
}

export default memo(AppShellComponent);
