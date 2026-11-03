"use client";

import { memo, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import Footer from "@/components/footer";

import { useNavigationTab } from "@/context/navigation-tab-context";

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

  // Real-time client listener for maintenance mode (throttled to max once per 10 minutes)
  useEffect(() => {
    if (isStandalonePage) return;

    let lastCheckTime = 0;
    const checkMaintenance = async (force = false) => {
      const now = Date.now();
      if (!force && now - lastCheckTime < 600_000) return; // 10 minutes throttle
      lastCheckTime = now;

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

    checkMaintenance(false);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        checkMaintenance(false);
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    const timer = setInterval(() => checkMaintenance(true), 600000); // 10 minutes

    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(timer);
    };
  }, [isStandalonePage]);

  if (isStandalonePage) {
    return <>{children}</>;
  }

  // Pages where footer must NOT be displayed:
  // 1. Movie detail pages (/phim/...)
  // 2. Watch history (/recently)
  // 3. Favorites (/favorites)
  const isMovieDetailPage = pathname.startsWith("/phim");
  const isRecentlyPage = pathname.startsWith("/recently");
  const isFavoritesPage = pathname.startsWith("/favorites");

  const showFooter = !isMovieDetailPage && !isRecentlyPage && !isFavoritesPage;

  return (
    <div className="min-h-screen bg-cinema-bg text-cinema-text">
      {/* Persistent Left Sidebar & Mobile Bottom Dock - Kept in DOM across transitions */}
      <Sidebar />

      {/* Persistent Top Header */}
      <Header />

      {/* Dynamic Right-side Content Container */}
      <div className="min-h-screen lg:pl-[268px] flex flex-col">
        {children}

        {/* Global Footer Card matching Hi Download (hidden on movie detail pages) */}
        {showFooter && <Footer />}
      </div>
    </div>
  );
}

export default memo(AppShellComponent);
