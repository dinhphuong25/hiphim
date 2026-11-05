"use client";

import { memo, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar";
import Header from "@/components/header";
import Footer from "@/components/footer";

interface AppShellProps {
  children: React.ReactNode;
}

function AppShellComponent({ children }: AppShellProps) {
  const pathname = usePathname();
  const lastMaintenanceCheckRef = useRef<number>(0);

  // Standalone pages that do not display the global sidebar/header
  const isStandalonePage =
    pathname.startsWith("/watch") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/maintenance");

  // Real-time client listener for maintenance mode (throttled to max once per 10 minutes)
  useEffect(() => {
    if (isStandalonePage) return;

    const checkMaintenance = async () => {
      const now = Date.now();
      if (now - lastMaintenanceCheckRef.current < 600_000) return;
      lastMaintenanceCheckRef.current = now;

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
    const timer = setInterval(checkMaintenance, 600_000); // 10 minutes

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
      <main id="main-content" tabIndex={-1} className="min-h-screen lg:pl-[268px] flex flex-col outline-none">
        {children}

        {/* Global Footer Card matching Hi Download (hidden on movie detail pages) */}
        {showFooter && <Footer />}
      </main>
    </div>
  );
}

export default memo(AppShellComponent);
